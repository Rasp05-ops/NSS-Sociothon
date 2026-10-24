"""Single Gemini entrypoint for all agents with explicit configuration errors and caching."""
import hashlib
import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env")
CACHE = Path(os.getenv("LLM_CACHE", str(PROJECT_ROOT / ".cache" / "llm.json")))
_cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}


class LLMConfigurationError(RuntimeError):
    """The application cannot call Gemini because configuration is missing."""


class LLMRequestError(RuntimeError):
    """Gemini could not complete a request after retries."""


def ask(prompt: str, system: str = "", temperature: float = 0.2, retries: int = 5) -> str:
    if os.getenv("BINLYTICS_DISABLE_LLM", "").lower() == "true":
        raise LLMConfigurationError("LLM calls are disabled for this process")
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise LLMConfigurationError("GEMINI_API_KEY is not configured")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    if not model:
        raise LLMConfigurationError("GEMINI_MODEL is empty")
    key = hashlib.sha256(f"{system}||{prompt}||{temperature}".encode()).hexdigest()
    if key in _cache:
        return _cache[key]
    from google import genai  # pip install google-genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    last_error: Exception | None = None
    for i in range(retries):
        try:
            r = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(system_instruction=system or None, temperature=temperature))
            text = (r.text or "").strip()
            if not text:
                raise LLMRequestError("Gemini returned an empty response")
            _cache[key] = text
            CACHE.parent.mkdir(parents=True, exist_ok=True)
            CACHE.write_text(json.dumps(_cache), encoding="utf-8")
            return text
        except LLMRequestError:
            raise
        except Exception as exc:
            last_error = exc
            if i + 1 < retries:
                time.sleep(min(2 ** i, 30))
    raise LLMRequestError(
        f"Gemini request failed after {retries} attempts: {type(last_error).__name__}"
    ) from last_error
