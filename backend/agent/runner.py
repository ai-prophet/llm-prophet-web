"""Agent run orchestration: config loading, thread management, event queue."""

from __future__ import annotations

import logging
import os
import threading
import uuid
from pathlib import Path
from queue import Queue

from config import AGENT_DEFAULTS, ENVIRONMENT_DEFAULTS, UserSettings, resolve_user_settings

logger = logging.getLogger("prophet_web.runner")

RUNS_DIR = Path(__file__).resolve().parent.parent / "runs"

_active_runs: dict[str, Queue] = {}


def _inject_api_keys(settings: UserSettings) -> None:
    if settings.openrouter_api_key:
        os.environ["OPENROUTER_API_KEY"] = settings.openrouter_api_key
    if settings.perplexity_api_key:
        os.environ["PERPLEXITY_API_KEY"] = settings.perplexity_api_key
    if settings.brave_api_key:
        os.environ["BRAVE_API_KEY"] = settings.brave_api_key


def start_run(
    title: str,
    outcomes: list[str],
    settings: UserSettings,
) -> tuple[str, Queue]:
    """Start an agent run in a background thread. Returns (run_id, event_queue)."""
    settings = resolve_user_settings(settings)

    from miniprophet.agent.context import SlidingWindowContextManager
    from miniprophet.environment.forecast_env import ForecastEnvironment, create_default_tools
    from miniprophet.environment.source_board import SourceBoard
    from miniprophet.models import get_model
    from miniprophet.search import get_search_tool

    from agent.web_agent import WebForecastAgent

    run_id = uuid.uuid4().hex[:12]
    event_queue: Queue = Queue()
    output_path = RUNS_DIR / run_id

    def _run() -> None:
        try:
            _inject_api_keys(settings)

            model_config = {
                "model_name": settings.model_name,
                "model_class": settings.model_class,
                "cost_tracking": "ignore_errors",
            }
            model = get_model(config=model_config)

            search_config = {"search_class": settings.search_backend}
            search_backend = get_search_tool(config=search_config)

            env_cfg = dict(ENVIRONMENT_DEFAULTS)
            agent_cfg = dict(AGENT_DEFAULTS)
            board = SourceBoard()
            tools = create_default_tools(
                search_tool=search_backend,
                outcomes=outcomes,
                board=board,
                search_limit=agent_cfg.get("search_limit", 10),
                search_results_limit=env_cfg.get("search_results_limit", 5),
                max_source_display_chars=env_cfg.get("max_source_display_chars", 2000),
            )
            env = ForecastEnvironment(tools, board=board, **env_cfg)

            context_window = agent_cfg.get("context_window", 6)
            ctx_mgr = (
                SlidingWindowContextManager(window_size=context_window)
                if context_window > 0
                else None
            )
            agent = WebForecastAgent(
                model=model,
                env=env,
                context_manager=ctx_mgr,
                event_queue=event_queue,
                output_path=str(output_path),
                **{k: v for k, v in agent_cfg.items() if k != "output_path"},
            )

            agent.run(title=title, outcomes=outcomes)
        except Exception as exc:
            logger.error("Agent run %s failed: %s", run_id, exc, exc_info=True)
            event_queue.put({
                "type": "run_end",
                "exit_status": type(exc).__name__,
                "submission": {},
                "board": [],
                "error": str(exc),
            })
            event_queue.put(None)
        finally:
            _active_runs.pop(run_id, None)

    _active_runs[run_id] = event_queue
    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    return run_id, event_queue


def get_run_queue(run_id: str) -> Queue | None:
    return _active_runs.get(run_id)
