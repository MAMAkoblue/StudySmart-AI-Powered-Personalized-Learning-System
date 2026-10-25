import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, save } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.post('/session', async (req, res) => {
  const { duration, type = 'focus', completed = true } = req.body;
  const db = getDb();
  const sess = { id: uuidv4(), userId: req.user.id, duration, type, completed, createdAt: new Date().toISOString() };
  db.data.pomodoroSessions.push(sess);
  const p = db.data.progress[req.user.id];
  if (p) p.sessions.push({ type: 'pomodoro', duration, date: new Date().toISOString() });
  updateStreak(db, req.user.id);
  await save();
  res.json(sess);
});

router.get('/stats', (req, res) => {
  const db = getDb();
  const sessions = db.data.pomodoroSessions.filter(s => s.userId === req.user.id);
  const totalMinutes = sessions.reduce((a, s) => a + (s.duration || 0), 0);
  res.json({ count: sessions.length, totalMinutes, sessions: sessions.slice(-20) });
});

function updateStreak(db, userId) {
  const today = new Date().toISOString().slice(0, 10);
  const s = db.data.streaks[userId] || { current: 0, longest: 0, lastDate: null };
  if (s.lastDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (s.lastDate === yesterday) s.current += 1;
  else s.current = 1;
  if (s.current > s.longest) s.longest = s.current;
  s.lastDate = today;
  db.data.streaks[userId] = s;
}

export default router;
