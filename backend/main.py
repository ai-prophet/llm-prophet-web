"""FastAPI application for mini-llm-prophet web interface."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.forecast import router as forecast_router

app = FastAPI(title="Mini LLM Prophet Web")

# CORS: allow frontend origin. In production, set CORS_ORIGINS env var
# (comma-separated list, e.g. "https://myapp.vercel.app,https://myapp.com")
_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").strip().split(",")
_cors_origins = [o.strip() for o in _cors_origins if o.strip()] or ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
