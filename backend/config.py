import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

AVAILABLE_MODELS = {
    "gemini-3-flash": "google/gemini-3-flash-preview",
    "qwen-9b": "qwen/qwen3.5-9b",
    "ministral-3b": "mistralai/ministral-3b-2512",
    "ministral-8b": "mistralai/ministral-8b-2512",
    "gemini-flash-lite": "google/gemini-3.1-flash-lite-preview",
}

DEFAULT_AGENT_MODEL = AVAILABLE_MODELS["gemini-3-flash"]
DEFAULT_JUDGE_MODEL = AVAILABLE_MODELS["gemini-3-flash"]

DEFENSE_PROMPT_ENABLED = os.getenv("DEFENSE_PROMPT_ENABLED", "true").lower() == "true"
