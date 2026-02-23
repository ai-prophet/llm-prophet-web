"""FastAPI application for mini-llm-prophet web interface."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.forecast import router as forecast_router

app = FastAPI(title="Mini LLM Prophet Web")

# CORS: allow frontend origin. Set CORS_ORIGINS for explicit origins (comma-separated).
# By default we allow localhost + *.vercel.app so Vercel deploys work without config.
_cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000").strip().split(",")
_cors_origins = [o.strip() for o in _cors_origins_raw if o.strip()] or ["http://localhost:3000"]
# Regex for Vercel: matches https://anything.vercel.app and preview URLs
_cors_origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
