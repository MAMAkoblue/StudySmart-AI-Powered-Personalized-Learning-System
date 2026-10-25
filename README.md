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

## Production
Build the frontend (`npm run build` in `frontend/`), then start the backend — it serves the built frontend from `frontend/dist`.
