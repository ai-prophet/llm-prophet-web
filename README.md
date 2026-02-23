# Mini LLM Prophet Web

Web interface for the mini-llm-prophet forecasting agent.

## Setup

### Backend

```bash
# clone the mini-llm-prophet to root
git clone https://github.com/ai-prophet/mini-llm-prophet

cd app/backend
pip install -r requirements.txt
pip install -e ../../mini-llm-prophet  # install the agent package
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd app/frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:8000`.

## Architecture

- **Backend**: FastAPI with SSE streaming. The `WebForecastAgent` inherits from `DefaultForecastAgent` and pushes events to a queue via hook overrides.
- **Frontend**: Next.js + TypeScript + Tailwind CSS. Chat-like main panel with a source board/searches sidebar.
