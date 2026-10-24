"""OWNER: B. One LLM entrypoint for ALL agents (so rate-limit handling + caching live in one place).
Gemini free tier is rate-limited and limits change: check your real quota in AI Studio, keep the cache ON in dev.
Model name comes from env (GEMINI_MODEL); verify which models are free for your key. NOT TESTED in the scaffold."""
import hashlib
import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
CACHE = Path(os.getenv("LLM_CACHE", ".cache/llm.json"))
_cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}


def ask(prompt: str, system: str = "", temperature: float = 0.2, retries: int = 5) -> str:
    key = hashlib.sha256(f"{system}||{prompt}||{temperature}".encode()).hexdigest()
    if key in _cache:
        return _cache[key]
    from google import genai  # pip install google-genai
    from google.genai import types

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    for i in range(retries):
        try:
            r = client.models.generate_content(
                model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"), contents=prompt,
                config=types.GenerateContentConfig(system_instruction=system or None, temperature=temperature))
            _cache[key] = r.text
            CACHE.parent.mkdir(exist_ok=True)
            CACHE.write_text(json.dumps(_cache))
            return r.text
        except Exception:  # 429 / transient -> exponential backoff
            time.sleep(min(2 ** i, 30))
    raise RuntimeError("LLM unavailable after retries; switch to the Ollama fallback or the cached demo path")
