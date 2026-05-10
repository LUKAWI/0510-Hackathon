"""DashScope API connectivity test: LLM generation + Embedding.

Run: cd api && python tests/test_llm.py
"""

from __future__ import annotations

import os
import sys
from http import HTTPStatus
from pathlib import Path

import dashscope
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

EMBEDDING_DIM = 1024
MODEL_LLM = "qwen3.5-plus"
MODEL_EMBEDDING = "text-embedding-v4"

_PASSED = 0
_FAILED = 0


def _pass(name: str, detail: str = "") -> None:
    global _PASSED
    _PASSED += 1
    msg = f"[PASS] {name}"
    if detail:
        msg += f" — {detail}"
    print(msg)


def _fail(name: str, reason: str = "") -> None:
    global _FAILED
    _FAILED += 1
    msg = f"[FAIL] {name}"
    if reason:
        msg += f" — {reason}"
    print(msg)


def test_llm_generation() -> None:
    api_key = os.environ.get("DASHSCOPE_API_KEY", "")
    if not api_key:
        _fail("LLM Generation", "DASHSCOPE_API_KEY not set")
        return

    try:
        response = dashscope.MultiModalConversation.call(
            model=MODEL_LLM,
            api_key=api_key,
            messages=[
                {"role": "user", "content": [{"text": "用一句话介绍人工智能"}]}
            ],
        )

        if response.status_code != HTTPStatus.OK:
            _fail("LLM Generation", f"code={response.code}, message={response.message}")
            return

        content = response.output.choices[0].message.content
        if isinstance(content, list):
            text = "".join(
                block["text"] if isinstance(block, dict) and "text" in block else str(block)
                for block in content
            )
        else:
            text = str(content)

        _pass("LLM Generation", f"model={MODEL_LLM}, reply={text[:80]}...")

    except Exception as exc:
        _fail("LLM Generation", str(exc))


def test_embedding() -> None:
    api_key = os.environ.get("DASHSCOPE_API_KEY", "")
    if not api_key:
        _fail("Embedding", "DASHSCOPE_API_KEY not set")
        return

    try:
        response = dashscope.TextEmbedding.call(
            model=MODEL_EMBEDDING,
            input=["测试文本"],
            dimension=EMBEDDING_DIM,
            api_key=api_key,
        )

        if response.status_code != HTTPStatus.OK:
            _fail("Embedding", f"code={response.code}, message={response.message}")
            return

        embedding = response.output["embeddings"][0]["embedding"]
        actual_dim = len(embedding)

        if actual_dim != EMBEDDING_DIM:
            _fail("Embedding", f"dimension {actual_dim} != expected {EMBEDDING_DIM}")
            return

        _pass("Embedding", f"model={MODEL_EMBEDDING}, dim={actual_dim}")

    except Exception as exc:
        _fail("Embedding", str(exc))


def main() -> None:
    print("=" * 60)
    print("DashScope API Connectivity Tests")
    print("=" * 60)
    print()

    test_llm_generation()
    print()
    test_embedding()

    print()
    print("=" * 60)
    total = _PASSED + _FAILED
    print(f"Results: {_PASSED}/{total} passed, {_FAILED}/{total} failed")
    print("=" * 60)

    if _FAILED > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
