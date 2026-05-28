"""CLI: train the time-to-failure forecaster per (asset_type, metric).

  python scripts/train_forecaster.py                 # synthetic seed
  python scripts/train_forecaster.py data/telem.parquet

Telemetry frame needs columns: ts, asset_id, asset_type, metric, value.
Artifacts land in models/triton/{asset_type}_{metric}/.
"""
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from atlas_ml.forecaster.train import train_all
from atlas_ml.synthetic import generate


def main():
    if len(sys.argv) > 1:
        src = sys.argv[1]
        telem = pd.read_parquet(src) if src.endswith(".parquet") else pd.read_csv(src)
        print(f"loaded {len(telem)} rows from {src}")
    else:
        telem = generate(days=30)
        print(f"synthetic seed: {len(telem)} rows")
    saved = train_all(telem)
    print(f"done: {len(saved)} models saved")


if __name__ == "__main__":
    main()
