"""Backend-local configuration. Does not rely on mini-llm-prophet's default.yaml.

Fixed agent parameters live here. User-configurable parameters (API keys,
model choice, search backend) are passed per-request via UserSettings.
"""

from __future__ import annotations

from pydantic import BaseModel

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

    model_class: str = "litellm"
    model_name: str = "google/gemini-2.5-flash-preview-05-20"
    search_backend: str = "perplexity"
    openrouter_api_key: str = ""
    perplexity_api_key: str = ""
    brave_api_key: str = ""

    model_config = {"extra": "ignore"}
