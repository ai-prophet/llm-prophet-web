"""Forecast API endpoints: plan, run, and SSE stream."""

from __future__ import annotations

import json
from queue import Empty

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from agent.runner import get_run_queue, start_run
from config import UserSettings
from services.planner import generate_forecast_plan

router = APIRouter(prefix="/api")


class PlanRequest(BaseModel):
    prompt: str
    settings: UserSettings = UserSettings()


class RunRequest(BaseModel):
    title: str
    outcomes: list[str]
    settings: UserSettings = UserSettings()


@router.post("/plan")
async def plan(req: PlanRequest):
    result = generate_forecast_plan(req.prompt, req.settings)
    return result


@router.post("/run")
async def run(req: RunRequest):
    if len(req.outcomes) < 2:
        raise HTTPException(400, "At least 2 outcomes are required.")
    run_id, _ = start_run(req.title, req.outcomes, req.settings)
    return {"run_id": run_id}


@router.get("/run/{run_id}/stream")
async def stream(run_id: str):
    queue = get_run_queue(run_id)
    if queue is None:
        raise HTTPException(404, f"Run '{run_id}' not found or already completed.")

    async def event_generator():
        while True:
            try:
                event = queue.get(timeout=0.5)
            except Empty:
                yield {"event": "ping", "data": "{}"}
                continue
            if event is None:
                break
            yield {"event": "message", "data": json.dumps(event)}

    return EventSourceResponse(event_generator())
