import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import { authMiddleware, register, login, me } from './middleware/auth.js';
import materialsRoutes from './routes/materials.js';
import generateRoutes from './routes/generate.js';
import quizzesRoutes from './routes/quizzes.js';
import flashcardsRoutes from './routes/flashcards.js';
import studyPlansRoutes from './routes/studyplans.js';
import pomodoroRoutes from './routes/pomodoro.js';
import analyticsRoutes from './routes/analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// auth endpoints
import { Router } from 'express';
const authRouter = Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authMiddleware, me);
app.use('/api/auth', authRouter);

app.use('/api/materials', materialsRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/studyplans', studyPlansRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/analytics', analyticsRoutes);

// serve frontend build (optional)
const dist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(dist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(dist, 'index.html'), err => {
    if (err) res.status(404).send('Frontend not built. Run npm run build in frontend.');
  });
});

const PORT = process.env.PORT || 5000;
initDb().then(() => {
  app.listen(PORT, () => console.log(`StudySmart backend running on http://localhost:${PORT}`));
});
