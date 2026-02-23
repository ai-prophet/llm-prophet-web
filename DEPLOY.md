# Deploying Mini LLM Prophet Web

This guide walks you through deploying the **backend** (FastAPI) and **frontend** (Next.js) for ~100 users. We use **Render** for the backend and **Vercel** for the frontend—both have free tiers and require no credit card.

> **Why this stack?** Cloudflare Workers don't yet support Python/FastAPI in production (still beta). Render + Vercel is the simplest, most reliable option for this app.

---

## Prerequisites

1. **GitHub account** – Your code must be in a GitHub repo (public or private).
2. **Render account** – [Sign up](https://render.com/register) (free, GitHub login).
3. **Vercel account** – [Sign up](https://vercel.com/signup) (free, GitHub login).

---

## Part 1: Deploy the Backend (Render)

### 1.1 Add mini-llm-prophet (required for Render)

Your backend depends on `mini-llm-prophet`. Add it as a **git submodule** so Render can clone it during build:

```bash
cd /path/to/prophet-agent/app    # your repo root (contains backend/, frontend/)
git submodule add https://github.com/ai-prophet/mini-llm-prophet mini-llm-prophet
git add .gitmodules mini-llm-prophet
git commit -m "Add mini-llm-prophet as submodule"
```

This creates `app/mini-llm-prophet/` inside your repo. The submodule will be cloned when Render runs `git submodule update --init --recursive` during the build (see step 1.2).

> **Alternative:** If your repo root is `prophet-agent` and contains both `app/` and `mini-llm-prophet/` as siblings, use Root Directory `app/backend` and Build Command `pip install -r requirements.txt && pip install -e ../../mini-llm-prophet` (no submodule init needed).

### 1.2 Push your code to GitHub

If not already done:

```bash
cd /path/to/prophet-agent/app
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/prophet-agent.git
git push -u origin main
```

> **If you used a submodule:** Push with `git push --recurse-submodules=on-demand` so the submodule reference is pushed too.

### 1.3 Create a Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Web Service**.
2. Connect your GitHub account if prompted.
3. Select the `prophet-agent` repository (or whatever your repo is named).
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `prophet-backend` (or any name) |
   | **Region** | Choose closest to your users |
   | **Root Directory** | `backend` |
   | **Runtime** | Python 3 |
   | **Build Command** | `cd .. && git submodule update --init --recursive && cd backend && pip install -r requirements.txt && pip install -e ../mini-llm-prophet` |
   | **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

5. Under **Advanced** → **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `CORS_ORIGINS` | *(leave empty for now; you'll set this in step 2.3 after deploying the frontend)* |

6. Click **Create Web Service**.

### 1.3 Get your backend URL

After the first deploy finishes (2–5 min), copy the service URL, e.g.:

```
https://prophet-backend-xxxx.onrender.com
```

Test it: open `https://prophet-backend-xxxx.onrender.com/api/health` in a browser. You should see `{"status":"ok"}`.

> **Free tier note:** Render free services spin down after 15 min of inactivity. The first request after that may take ~30–60 seconds to wake up. For ~100 users this is usually fine.

---

## Part 2: Deploy the Frontend (Vercel)

### 2.1 Import the project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**.
2. Import your `prophet-agent` repository.
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Next.js (auto-detected) |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm run build` (default) |
   | **Output Directory** | `.next` (default) |

4. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://prophet-backend-xxxx.onrender.com` |

   *(Use the exact backend URL from Part 1.3.)*

5. Click **Deploy**.

### 2.2 Get your frontend URL

After the deploy completes, you'll get a URL like:

```
https://prophet-agent-xxxx.vercel.app
```

### 2.3 Update backend CORS

Go back to Render → your backend service → **Environment** → edit `CORS_ORIGINS`:

- Set it to your Vercel URL: `https://prophet-agent-xxxx.vercel.app`
- If you use a custom domain later, add it comma-separated: `https://prophet-agent-xxxx.vercel.app,https://yourdomain.com`

Save. Render will redeploy automatically.

---

## Part 3: Verify

1. Open your Vercel frontend URL in a browser.
2. Open **Settings** and add your API keys (OpenRouter, Perplexity, or Brave—depending on your config).
3. Run a forecast. If it works, you're done.

---

## Optional: Custom Domain

### Vercel (frontend)

1. Project → **Settings** → **Domains**.
2. Add your domain (e.g. `prophet.yourdomain.com`).
3. Follow Vercel's DNS instructions.

### Render (backend)

1. Service → **Settings** → **Custom Domain**.
2. Add your domain (e.g. `api.prophet.yourdomain.com`).
3. Update `NEXT_PUBLIC_API_URL` in Vercel to the new backend URL.
4. Add the new frontend domain to `CORS_ORIGINS` on Render.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **CORS errors** in browser console | Ensure `CORS_ORIGINS` on Render includes your exact frontend URL (with `https://`, no trailing slash). |
| **502 / 503** on first load | Free tier cold start—wait 30–60 seconds and retry. |
| **"Run not found"** or SSE disconnects | Backend may have restarted; refresh and try again. |
| **Build fails on Render** | Check that `mini-llm-prophet` exists at repo root. If it's a submodule, ensure it's initialized. |
| **Build fails on Vercel** | Ensure Root Directory is `app/frontend` and `NEXT_PUBLIC_API_URL` is set. |

---

## Cost Summary (~100 users)

| Service | Free tier | Notes |
|---------|-----------|-------|
| **Render** | 750 hrs/month | Enough for one always-on free service. |
| **Vercel** | 100 GB bandwidth | Plenty for ~100 users. |

No credit card required for either. If you outgrow free tiers, Render paid plans start at ~$7/mo and Vercel Pro at $20/mo.
