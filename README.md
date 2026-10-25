# StudySmart — AI-Powered Personalized Learning System

A full-stack app that lets students upload reading materials/modules and generate reviewers (quizzes or flashcards), with a Pomodoro timer, progress analytics, streaks, and personalized study plans.

## Structure
- `backend/` — Node.js + Express + lowdb (JSON storage)
- `frontend/` — React + Vite + TailwindCSS

## Run (development)

### Backend
```bash
cd backend
npm install
npm start
```
Runs on http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173 (proxies /api to backend)

## Optional AI
Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in the backend environment to use OpenAI for generation. Without it, StudySmart uses a built-in offline heuristic generator, so the app works fully without any API key.

## Deploy to the internet (Render example)

This repo includes a `Dockerfile` and `render.yaml` so you can deploy as a single web service (backend + built frontend) with persistent storage.

1. Push the project to GitHub.
2. Create a free account on Render (https://render.com) and choose **New → Blueprint**.
3. Connect your GitHub repo; Render will read `render.yaml` and create the service.
4. Render sets `JWT_SECRET` automatically and mounts a 1 GB disk at `/data` for the JSON database (`DATA_DIR=/data`).
5. (Optional) Add `OPENAI_API_KEY` in the service environment variables to enable AI generation.

The app will be available at the Render URL (e.g. https://studysmart.onrender.com). Data persists on the mounted disk.

### Other platforms
- **Railway / Fly.io / any Docker host**: build with `docker build -t studysmart .` then run `docker run -p 8080:8080 -v studysmart-data:/data -e JWT_SECRET=... studysmart`.
- **Vercel (frontend only)** + **Render (backend)**: deploy frontend to Vercel with `VITE_API_URL` pointing to your backend URL, and backend to Render. Ensure CORS allows your frontend origin.
