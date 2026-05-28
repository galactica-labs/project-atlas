"""QuantileForecaster — vendored renewable-energy LightGBM quantile core,
adapted for asset time-to-failure forecasting.

What is reused as-is from the original forecaster:
  - quantile objective (one booster per alpha in {0.05, 0.50, 0.95})
  - empirical conformal calibration of each quantile on a held-out window
What changed:
  - target is an asset metric trajectory, not next-day price
  - electricity feature stack replaced (see features.py)
  - horizon-as-feature direct multi-step prediction

If LightGBM is unavailable (e.g. CPU-only demo box where install failed) the
class degrades to a per-quantile gradient-free linear fit so the pipeline still
returns calibrated-looking bands instead of crashing. Coordination doc §11
cut #6 (pre-computed trajectories) is the other fallback layer.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

QUANTILE_ALPHAS = [0.05, 0.50, 0.95]

try:
    import lightgbm as lgb  # noqa
    _HAS_LGB = True
except Exception:  # pragma: no cover
    _HAS_LGB = False


_LGB_PARAMS = {
    "objective": "quantile",
    "metric": "quantile",
    "learning_rate": 0.05,
    "num_leaves": 31,            # demo-sized; doc §12 risk row: keep small
    "min_data_in_leaf": 30,
    "feature_fraction": 0.85,
    "bagging_fraction": 0.85,
    "bagging_freq": 5,
    "verbose": -1,
}


class _LinearQuantile:
    """Dependency-free fallback: least-squares fit + fixed residual-quantile shift."""

    def __init__(self, alpha: float):
        self.alpha = alpha
        self.coef_: np.ndarray | None = None
        self.shift_ = 0.0

    def fit(self, X: np.ndarray, y: np.ndarray):
        Xb = np.c_[np.ones(len(X)), X]
        self.coef_, *_ = np.linalg.lstsq(Xb, y, rcond=None)
        resid = y - Xb @ self.coef_
        self.shift_ = float(np.quantile(resid, self.alpha))
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        Xb = np.c_[np.ones(len(X)), X]
        return Xb @ self.coef_ + self.shift_


class QuantileForecaster:
    def __init__(self, feature_cols: list[str] | None = None):
        self.feature_cols = feature_cols
        self._models: dict[float, object] = {}
        self._conformal: dict[float, float] = {a: 0.0 for a in QUANTILE_ALPHAS}
        self.metrics: dict = {}

    # ── training ──────────────────────────────────────────────────────────
    def fit(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        valid_frac: float = 0.2,
        num_boost_round: int = 600,
    ) -> "QuantileForecaster":
        self.feature_cols = list(X.columns)
        n = len(X)
        cut = int(n * (1 - valid_frac))
        Xtr, Xva = X.iloc[:cut], X.iloc[cut:]
        ytr, yva = y.iloc[:cut], y.iloc[cut:]

        for alpha in QUANTILE_ALPHAS:
            if _HAS_LGB:
                params = {**_LGB_PARAMS, "alpha": alpha}
                dtr = lgb.Dataset(Xtr, ytr)
                dva = lgb.Dataset(Xva, yva, reference=dtr)
                booster = lgb.train(
                    params, dtr, num_boost_round=num_boost_round,
                    valid_sets=[dva],
                    callbacks=[lgb.early_stopping(60, verbose=False),
                               lgb.log_evaluation(period=0)],
                )
                self._models[alpha] = booster
                va_pred = booster.predict(Xva, num_iteration=booster.best_iteration)
            else:
                m = _LinearQuantile(alpha).fit(Xtr.to_numpy(), ytr.to_numpy())
                self._models[alpha] = m
                va_pred = m.predict(Xva.to_numpy())

            # empirical conformal shift: align observed coverage to the nominal alpha
            resid = yva.to_numpy() - va_pred
            self._conformal[alpha] = float(np.quantile(resid, alpha)) if len(resid) else 0.0

        self.metrics = {"n_train": int(cut), "n_valid": int(n - cut), "lgbm": _HAS_LGB}
        return self

    # ── inference ─────────────────────────────────────────────────────────
    def _predict_alpha(self, alpha: float, X: pd.DataFrame) -> np.ndarray:
        m = self._models[alpha]
        if _HAS_LGB and hasattr(m, "best_iteration"):
            raw = m.predict(X[self.feature_cols], num_iteration=m.best_iteration)
        else:
            raw = m.predict(X[self.feature_cols].to_numpy())
        return np.asarray(raw) + self._conformal[alpha]

    def predict_quantiles(self, X: pd.DataFrame) -> dict[float, np.ndarray]:
        out = {a: self._predict_alpha(a, X) for a in QUANTILE_ALPHAS}
        # enforce monotonicity q05 <= q50 <= q95 (quantile crossing guard)
        q05, q50, q95 = out[0.05], out[0.50], out[0.95]
        q50 = np.maximum(q50, q05)
        q95 = np.maximum(q95, q50)
        return {0.05: q05, 0.50: q50, 0.95: q95}

    # ── persistence ───────────────────────────────────────────────────────
    def save(self, path: str | Path) -> Path:
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        meta = {
            "feature_cols": self.feature_cols,
            "conformal": {str(k): v for k, v in self._conformal.items()},
            "metrics": self.metrics,
            "lgbm": _HAS_LGB,
        }
        for alpha, m in self._models.items():
            key = f"q{int(alpha * 100):02d}"
            if _HAS_LGB and hasattr(m, "save_model"):
                m.save_model(str(path / f"lgbm_{key}.txt"))
            else:
                np.savez(path / f"linear_{key}.npz", coef=m.coef_, shift=m.shift_, alpha=m.alpha)
        (path / "meta.json").write_text(json.dumps(meta, indent=2))
        return path

    @classmethod
    def load(cls, path: str | Path) -> "QuantileForecaster":
        path = Path(path)
        meta = json.loads((path / "meta.json").read_text())
        self = cls(feature_cols=meta["feature_cols"])
        self._conformal = {float(k): v for k, v in meta["conformal"].items()}
        self.metrics = meta.get("metrics", {})
        for alpha in QUANTILE_ALPHAS:
            key = f"q{int(alpha * 100):02d}"
            lgb_path = path / f"lgbm_{key}.txt"
            lin_path = path / f"linear_{key}.npz"
            if _HAS_LGB and lgb_path.exists():
                self._models[alpha] = lgb.Booster(model_file=str(lgb_path))
            elif lin_path.exists():
                d = np.load(lin_path)
                m = _LinearQuantile(float(d["alpha"]))
                m.coef_, m.shift_ = d["coef"], float(d["shift"])
                self._models[alpha] = m
            else:
                raise FileNotFoundError(f"no artifact for {key} in {path}")
        return self
