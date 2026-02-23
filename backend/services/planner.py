"""Planner service: uses an LLM to generate a structured forecasting problem from a user prompt."""

from __future__ import annotations

import json
import logging
import os

import litellm

from config import UserSettings

logger = logging.getLogger("prophet_web.planner")

SYSTEM_PROMPT = """\
You are a forecasting problem structurer. Given a user's natural language question about a future event, \
generate a structured forecasting problem with a clear title and a list of mutually exclusive outcomes.

Rules:
- The title should be a clear, specific question.
- List at most 8 possible outcomes. If there are many possibilities, group less likely ones under "Other".
- Outcomes should be mutually exclusive and collectively exhaustive.
- Return ONLY valid JSON with no markdown formatting.

Output format:
{"status": "success", "title": "...", "outcomes": ["Outcome A", "Outcome B", ...]}

If the user's input is too vague or not a forecasting question, return:
{"status": "error", "message": "...explanation..."}
"""


def _inject_api_keys(settings: UserSettings) -> None:
    """Temporarily set env vars so litellm can pick up the right keys."""
    if settings.openrouter_api_key:
        os.environ["OPENROUTER_API_KEY"] = settings.openrouter_api_key
    if settings.perplexity_api_key:
        os.environ["PERPLEXITY_API_KEY"] = settings.perplexity_api_key
    if settings.brave_api_key:
        os.environ["BRAVE_API_KEY"] = settings.brave_api_key


def generate_forecast_plan(prompt: str, settings: UserSettings) -> dict:
    """Call the planner LLM to structure a user prompt into a forecasting problem.

    Uses the user's configured model and API keys.
    """
    _inject_api_keys(settings)

    planner_model = settings.model_name
    # we need to preprend "openrouter/" to model name if given openrouter_api_key
    if settings.openrouter_api_key:
        planner_model = "openrouter/" + planner_model

    try:
        response = litellm.completion(
            model=planner_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        result = json.loads(raw)
        if "status" not in result:
            result["status"] = "success"
        return result
    except json.JSONDecodeError:
        return {"status": "error", "message": "Failed to parse LLM response as JSON."}
    except Exception as exc:
        logger.error("Planner LLM call failed: %s", exc, exc_info=True)
        return {"status": "error", "message": f"LLM call failed: {exc}"}
