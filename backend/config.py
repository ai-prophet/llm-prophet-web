"""Backend-local configuration. Does not rely on mini-llm-prophet's default.yaml.

Fixed agent parameters live here. User-configurable parameters (API keys,
model choice, search backend) are passed per-request via UserSettings.
"""

from __future__ import annotations

import hmac
import os

from pydantic import BaseModel

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover - dependency optional at import time
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv()

DEFAULT_ADMIN_API_KEY = "PLACEHOLDER"
ADMIN_API_KEY_ENV_VAR = "MINI_PROPHET_ADMIN_API_KEY"

AGENT_SYSTEM_TEMPLATE = """\
You are a forecasting agent specialized in researching and predicting real-world event outcomes.

Your goal is to gather evidence through web searches, organize your findings on a source board,
and ultimately submit a well-reasoned probabilistic forecast.

## Strategy

1. Start by searching for relevant, recent information about the forecasting problem.
2. For each useful source, add it to your source board with analytical notes about its
   relevance, reliability, and key insights.
3. If later evidence contradicts an earlier source, use edit_note to update your assessment
   (e.g. mark it as unreliable or outdated).
4. Once you have gathered sufficient evidence, submit your probabilistic forecast.

## Guidelines

- Think critically about source reliability. News from authoritative outlets, official
  statistics, and expert analyses should carry more weight than rumors or opinion pieces.
- Consider multiple perspectives and potential biases in your sources.
- Your final probabilities should reflect the balance of evidence you've gathered.
- Each probability must be between 0 and 1. Provide probabilities for ALL listed outcomes.
"""

AGENT_INSTANCE_TEMPLATE = """\
<forecast_problem>
Title: {title}
Possible Outcomes: {outcomes_formatted}
Current System Time (in UTC): {current_time}
</forecast_problem>

Research this problem using the search tool, organize evidence on your source board,
then submit your probabilistic forecast. Be thorough but efficient.
"""

AGENT_DEFAULTS = {
    "system_template": AGENT_SYSTEM_TEMPLATE,
    "instance_template": AGENT_INSTANCE_TEMPLATE,
    "step_limit": 30,
    "cost_limit": 3.0,
    "search_limit": 10,
    "max_outcomes": 20,
    "context_window": 6,
    "show_current_time": False,
}

ENVIRONMENT_DEFAULTS = {
    "search_results_limit": 5,
    "max_source_display_chars": 2000,
}


class UserSettings(BaseModel):
    """User-provided settings sent with each request."""

    model_class: str = "openrouter"
    model_name: str = "google/gemini-3-flash-preview"
    search_backend: str = "perplexity"
    admin_api_key: str = ""
    openrouter_api_key: str = ""
    perplexity_api_key: str = ""
    brave_api_key: str = ""

    model_config = {"extra": "ignore"}


class InvalidAdminAPIKey(ValueError):
    """Raised when an admin_api_key is provided but does not validate."""


def _is_valid_admin_api_key(provided_key: str) -> bool:
    expected_key = os.getenv(ADMIN_API_KEY_ENV_VAR, DEFAULT_ADMIN_API_KEY)
    return hmac.compare_digest(provided_key.strip(), expected_key.strip())


def resolve_user_settings(settings: UserSettings) -> UserSettings:
    """Resolve effective settings, including admin-backed key fallback."""
    resolved = settings.model_copy(deep=True)
    admin_key = resolved.admin_api_key.strip()
    if not admin_key:
        return resolved

    if not _is_valid_admin_api_key(admin_key):
        raise InvalidAdminAPIKey("Invalid admin_api_key.")

    if not resolved.openrouter_api_key:
        resolved.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not resolved.perplexity_api_key:
        resolved.perplexity_api_key = os.getenv("PERPLEXITY_API_KEY", "")
    if not resolved.brave_api_key:
        resolved.brave_api_key = os.getenv("BRAVE_API_KEY", "")
    return resolved
