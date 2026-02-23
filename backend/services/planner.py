"""Planner service: uses an LLM to generate a structured forecasting problem from a user prompt."""

from __future__ import annotations

import json
import logging
import os

import litellm

from config import UserSettings, resolve_user_settings

logger = logging.getLogger("prophet_web.planner")

SYSTEM_PROMPT = """\
You are a forecasting problem structurer. Given a user's natural language question about a future event, \
generate a structured forecasting problem with a clear title and a list of mutually exclusive outcomes.

Rules:
- The title should be a clear, specific question. If the user's provided input is already detailed enough, use it as the title and try not to override/change it.
- The user might or might not provide a list of potential outcomes in the input. If already provided, use these outcomes and do not add/delete any one of them.
- If the user did not provide a list of outcomes, try to infer **at most 8 possible outcomes based on the input**. If there are many possibilities, group less likely ones under "Other".
- Depending on the input event type, the list of outcomes may or may not be mutually exclusive. Make your own judgement.
- Return ONLY valid JSON with no markdown formatting.

IMPORTANT: your only role is to help structure the forecasting problem. Reject any other types of tasks by raising "status: error" in your response!

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
    settings = resolve_user_settings(settings)
    _inject_api_keys(settings)

    planner_model = settings.model_name
    # Use OpenRouter model path when model_class is openrouter.
    if settings.model_class == "openrouter" and not planner_model.startswith("openrouter/"):
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
