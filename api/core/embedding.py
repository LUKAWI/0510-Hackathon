"""Embedding service using DashScope TextEmbedding API (text-embedding-v4, configurable dim)."""

from __future__ import annotations

import logging
import os
from http import HTTPStatus

import dashscope

from api.core.config import settings

logger = logging.getLogger(__name__)

_MODEL_NAME = dashscope.TextEmbedding.Models.text_embedding_v4
_BATCH_LIMIT = 25  # DashScope API 单次调用最大支持 25 条


class EmbeddingService:
    """Singleton embedding service via DashScope TextEmbedding API. 无需本地模型。"""

    _instance: EmbeddingService | None = None
    _initialised: bool = False

    def __init__(self, api_key: str = "") -> None:
        if not self._initialised:
            self._api_key = api_key or os.environ.get("DASHSCOPE_API_KEY", "")
            self._initialised = True

    def __new__(cls, api_key: str = "") -> EmbeddingService:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def encode(self, texts: list[str], batch_size: int = 20) -> list[list[float]]:
        """Batch-encode texts via DashScope API. batch_size rounds down to _BATCH_LIMIT."""
        bs = min(batch_size, _BATCH_LIMIT)
        results: list[list[float]] = []

        for i in range(0, len(texts), bs):
            batch = texts[i : i + bs]
            response = dashscope.TextEmbedding.call(
                model=_MODEL_NAME,
                input=batch,
                dimension=settings.EMBEDDING_DIM,
                api_key=self._api_key,
            )

            if response.status_code != HTTPStatus.OK:
                raise RuntimeError(
                    f"DashScope embedding error: {response.code} - {response.message}"
                )

            for emb in response.output["embeddings"]:
                results.append(emb["embedding"])

            logger.debug("Embedded batch %d/%d", i + len(batch), len(texts))

        return results

    def encode_single(self, text: str) -> list[float]:
        """Encode a single text. 复用 batch 接口以保证一致性。"""
        return self.encode([text])[0]

    @staticmethod
    def similarity(vec_a: list[float], vec_b: list[float]) -> float:
        """Cosine similarity via dot product (dashscope vectors are L2-normalised)."""
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        return max(0.0, min(1.0, dot))

    @staticmethod
    def get_dimension() -> int:
        return settings.EMBEDDING_DIM
