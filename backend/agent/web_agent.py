"""WebForecastAgent: pushes structured events to a queue for SSE streaming."""

from __future__ import annotations

import json
import logging
from queue import Queue

from miniprophet import ContextManager, Environment, Model
from miniprophet.agent.default import AgentConfig, DefaultForecastAgent, ForecastResult

logger = logging.getLogger("prophet_web.agent")


def _serialize_search_results(results: list) -> list[dict]:
    """Convert (sid, Source) tuples to JSON-safe dicts."""
    out = []
    for sid, src in results:
        out.append({
            "id": sid,
            "title": src.title,
            "url": src.url,
            "snippet": src.snippet,
        })
    return out


class WebForecastAgent(DefaultForecastAgent):
    """Agent subclass that pushes hook events to a queue for SSE consumption."""

    def __init__(
        self,
        model: Model,
        env: Environment,
        *,
        context_manager: ContextManager | None = None,
        event_queue: Queue | None = None,
        **kwargs,
    ) -> None:
        super().__init__(model=model, env=env, context_manager=context_manager, **kwargs)
        self._queue: Queue = event_queue or Queue()

    @property
    def event_queue(self) -> Queue:
        return self._queue

    def _emit(self, event: dict) -> None:
        self._queue.put(event)

    def on_run_start(self, title: str, outcomes: str, config: AgentConfig) -> None:
        self._emit({
            "type": "run_start",
            "title": title,
            "outcomes": outcomes,
            "step_limit": config.step_limit,
            "cost_limit": config.cost_limit,
        })

    def on_step_start(
        self, step: int, model_cost: float, search_cost: float, total_cost: float
    ) -> None:
        self._emit({
            "type": "step_start",
            "step": step,
            "model_cost": round(model_cost, 6),
            "search_cost": round(search_cost, 6),
            "total_cost": round(total_cost, 6),
        })

    def on_model_response(self, message: dict) -> None:
        content = message.get("content", "")
        extra = message.get("extra", {})
        actions = extra.get("actions", [])
        thinking = ""
        if isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "thinking":
                    thinking = block.get("thinking", "")
                elif isinstance(block, dict) and block.get("type") == "text":
                    content = block.get("text", "")
        parsed_actions = []
        for a in actions:
            raw_args = a.get("arguments", "{}")
            try:
                args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
            except json.JSONDecodeError:
                args = {}
            parsed_actions.append({"name": a.get("name", ""), "arguments": args})

        self._emit({
            "type": "model_response",
            "content": content if isinstance(content, str) else "",
            "thinking": thinking,
            "actions": parsed_actions,
        })

    def on_observation(self, action: dict, output: dict) -> None:
        tool_name = action.get("name", "")
        raw_args = action.get("arguments", "{}")
        try:
            args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
        except json.JSONDecodeError:
            args = {}

        event: dict = {
            "type": "observation",
            "tool": tool_name,
            "error": output.get("error", False),
            "output_text": output.get("output", ""),
        }

        if tool_name == "search":
            event["query"] = args.get("query", "")
            search_results = output.get("search_results", [])
            event["search_results"] = _serialize_search_results(search_results)

        elif tool_name == "add_source":
            event["source_id"] = args.get("source_id", "")
            event["note"] = args.get("note", "")

        elif tool_name == "edit_note":
            event["board_id"] = args.get("board_id")
            event["new_note"] = args.get("new_note", "")

        elif tool_name == "submit":
            event["probabilities"] = args.get("probabilities", {})

        self._emit(event)

    def on_run_end(self, result: ForecastResult) -> None:
        board = result.get("board", [])
        self._emit({
            "type": "run_end",
            "exit_status": result.get("exit_status", "unknown"),
            "submission": result.get("submission", {}),
            "board": board,
        })
        self._queue.put(None)
