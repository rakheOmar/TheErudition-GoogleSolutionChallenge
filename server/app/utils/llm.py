import os
from typing import Any

import litellm
from dotenv import load_dotenv
from litellm import acompletion, completion

load_dotenv()


def _load_keys(prefix: str) -> str | None:
    keys: list[str] = []
    for i in range(1, 100):
        key = os.getenv(f"{prefix}_API_KEY_{i}")
        if key:
            keys.append(key)
    if keys:
        return ",".join(keys)
    return None


def _setup_litellm_keys() -> None:
    groq_keys = _load_keys("GROQ")
    if groq_keys:
        os.environ["GROQ_API_KEY"] = groq_keys

    gemini_keys = _load_keys("GEMINI")
    if gemini_keys:
        os.environ["GEMINI_API_KEY"] = gemini_keys


_setup_litellm_keys()


litellm.drop_params = True


class LLMClient:
    async def generate(
        self,
        messages: list[dict[str, Any]],
        model: str = "groq/llama-3.3-70b-versatile",
        **kwargs: Any,
    ) -> dict[str, Any]:
        response = await acompletion(
            model=model,
            messages=messages,
            **kwargs,
        )
        return response.json()  # type: ignore[no-any-return]

    def generate_sync(
        self,
        messages: list[dict[str, Any]],
        model: str = "groq/llama-3.3-70b-versatile",
        **kwargs: Any,
    ) -> dict[str, Any]:
        response = completion(
            model=model,
            messages=messages,
            **kwargs,
        )
        return response.json()  # type: ignore[no-any-return]


llm_client = LLMClient()
