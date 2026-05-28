"""LLM adapter — single point of contact for all LLM ops (coordination doc §4.1).

Backend chosen by env `ATLAS_LLM_BACKEND` in {anthropic, openai, offline}.
Embeddings by `ATLAS_EMBED_BACKEND` in {openai, offline}.

`offline` is a deterministic, dependency-free fallback so the whole reasoning
chain runs in CI / on the demo box with no API keys. It is NOT a real model —
it produces stable templated text and hashed embeddings purely so downstream
code (Triton narrative, Hermes RAG cosine) has well-typed inputs to work with.

Interface is synchronous here for hackathon ergonomics; the doc's async
signatures can wrap these directly. Never `import anthropic/openai` outside
this module.
"""
from __future__ import annotations

import hashlib
import math
import os
from typing import Literal

from pydantic import BaseModel

EMBED_DIM = 256


class LLMMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


def _offline_complete(messages: list[LLMMessage]) -> str:
    user = next((m.content for m in reversed(messages) if m.role == "user"), "")
    digest = hashlib.sha1(user.encode()).hexdigest()[:8]
    return (
        "[offline-llm] Based on the telemetry and forecast provided, the most "
        "likely explanation is consistent with the stated failure-mode hypothesis. "
        f"(deterministic stub {digest})"
    )


def _offline_embed(text: str) -> list[float]:
    # hashed bag-of-tokens -> fixed dim, L2-normalized. Stable across runs.
    vec = [0.0] * EMBED_DIM
    for tok in text.lower().split():
        h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
        vec[h % EMBED_DIM] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


class LLMAdapter:
    def __init__(self):
        self.backend = os.getenv("ATLAS_LLM_BACKEND", "offline")
        self.embed_backend = os.getenv("ATLAS_EMBED_BACKEND", "offline")

    def complete(
        self,
        messages: list[LLMMessage],
        role: Literal["agent", "classifier", "explainer"] = "agent",
        max_tokens: int = 1024,
        temperature: float = 0.3,
        json_mode: bool = False,
    ) -> str:
        if self.backend == "offline":
            return _offline_complete(messages)
        if self.backend == "anthropic":
            import anthropic  # noqa
            client = anthropic.Anthropic()
            model = os.getenv("ATLAS_ANTHROPIC_MODEL", "claude-sonnet-4-6")
            sys_txt = "\n".join(m.content for m in messages if m.role == "system")
            turns = [{"role": m.role, "content": m.content} for m in messages if m.role != "system"]
            resp = client.messages.create(
                model=model, max_tokens=max_tokens, temperature=temperature,
                system=sys_txt or None, messages=turns,
            )
            return resp.content[0].text
        if self.backend == "openai":
            import openai  # noqa
            client = openai.OpenAI()
            model = os.getenv("ATLAS_OPENAI_MODEL", "gpt-4o")
            resp = client.chat.completions.create(
                model=model, max_tokens=max_tokens, temperature=temperature,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                response_format={"type": "json_object"} if json_mode else None,
            )
            return resp.choices[0].message.content
        raise ValueError(f"unknown ATLAS_LLM_BACKEND {self.backend}")

    def embed(self, texts: list[str]) -> list[list[float]]:
        if self.embed_backend == "offline":
            return [_offline_embed(t) for t in texts]
        if self.embed_backend == "openai":
            import openai  # noqa
            client = openai.OpenAI()
            model = os.getenv("ATLAS_EMBED_MODEL", "text-embedding-3-small")
            resp = client.embeddings.create(model=model, input=texts)
            return [d.embedding for d in resp.data]
        raise ValueError(f"unknown ATLAS_EMBED_BACKEND {self.embed_backend}")


llm = LLMAdapter()  # singleton; import from atlas_ml.llm
