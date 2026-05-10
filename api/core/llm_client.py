from __future__ import annotations

import json
import logging
import os
import re
from http import HTTPStatus

import dashscope
from dashscope import MultiModalConversation

logger = logging.getLogger(__name__)

_DEFAULT_MODEL = "qwen3.5-plus"


class LLMClient:
    """Tongyi Qianwen LLM client with token usage tracking.

    Uses dashscope.MultiModalConversation.call() for qwen3.5-plus compatibility.
    Not thread-safe — use separate instances across threads.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = _DEFAULT_MODEL,
    ) -> None:
        self._api_key: str = api_key or os.environ.get("DASHSCOPE_API_KEY", "")
        self._model: str = model
        self._total_input_tokens: int = 0
        self._total_output_tokens: int = 0
        self._total_tokens: int = 0

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> str:
        messages = _build_messages(prompt, system_prompt)
        response = MultiModalConversation.call(
            model=self._model,
            api_key=self._api_key,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        _check_response(response)
        self._accumulate_usage(response)

        return _extract_text(response)

    def generate_json(
        self,
        prompt: str,
        system_prompt: str = "",
        max_retries: int = 3,
    ) -> dict | list | None:
        messages = _build_messages(prompt, system_prompt)

        for attempt in range(1, max_retries + 1):
            response = MultiModalConversation.call(
                model=self._model,
                api_key=self._api_key,
                messages=messages,
                temperature=0.0,
                max_tokens=4096,
            )

            if response.status_code != HTTPStatus.OK:
                logger.warning(
                    "LLM call failed (attempt %d/%d): code=%s, message=%s",
                    attempt, max_retries, response.code, response.message,
                )
                continue

            self._accumulate_usage(response)
            raw = _extract_text(response)
            parsed = _parse_json(raw)

            if parsed is not None:
                return parsed

            logger.warning(
                "JSON parse failed (attempt %d/%d), raw: %s",
                attempt, max_retries, raw[:500],
            )

        logger.error("All %d attempts to generate valid JSON failed.", max_retries)
        return None

    def get_token_usage(self) -> dict[str, int]:
        return {
            "input_tokens": self._total_input_tokens,
            "output_tokens": self._total_output_tokens,
            "total_tokens": self._total_tokens,
        }

    def _accumulate_usage(self, response: object) -> None:
        usage = getattr(response, "usage", None)
        if usage is None:
            return
        input_tok: int = getattr(usage, "input_tokens", 0) or 0
        output_tok: int = getattr(usage, "output_tokens", 0) or 0
        total_tok: int = getattr(usage, "total_tokens", 0) or (input_tok + output_tok)
        self._total_input_tokens += input_tok
        self._total_output_tokens += output_tok
        self._total_tokens += total_tok


def _build_messages(prompt: str, system_prompt: str) -> list[dict]:
    messages: list[dict] = []
    if system_prompt:
        messages.append({"role": "system", "content": [{"text": system_prompt}]})
    messages.append({"role": "user", "content": [{"text": prompt}]})
    return messages


def _check_response(response: object) -> None:
    if response.status_code != HTTPStatus.OK:  # type: ignore[union-attr]
        raise RuntimeError(
            f"Tongyi Qianwen API error: code={response.code}, "  # type: ignore[union-attr]
            f"message={response.message}"  # type: ignore[union-attr]
        )


def _extract_text(response: object) -> str:
    content = response.output.choices[0].message.content  # type: ignore[union-attr]
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, dict) and "text" in block:
                parts.append(block["text"])
            elif isinstance(block, str):
                parts.append(block)
        return "".join(parts)
    return str(content)


def _parse_json(raw: str) -> dict | list | None:
    stripped = raw.strip()
    if not stripped:
        return None

    result = _try_loads(stripped)
    if result is not None:
        return result

    code_block = _extract_code_block(stripped)
    if code_block is not None:
        result = _try_loads(code_block)
        if result is not None:
            return result

    no_trailing = re.sub(r",\s*([}\]])", r"\1", stripped)
    result = _try_loads(no_trailing)
    if result is not None:
        return result

    if '"' not in stripped and "'" in stripped:
        single_to_double = stripped.replace("'", '"')
        result = _try_loads(single_to_double)
        if result is not None:
            return result

    return None


def _try_loads(text: str) -> dict | list | None:
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return None


def _extract_code_block(text: str) -> str | None:
    pattern = r"```(?:json)?\s*\n?(.*?)\n?\s*```"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None
