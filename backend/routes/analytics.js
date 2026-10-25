import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const p = db.data.progress[req.user.id] || {};
  const streak = db.data.streaks[req.user.id] || { current: 0, longest: 0 };
  const quizzes = db.data.quizzes.filter(q => q.userId === req.user.id);
  const attempts = quizzes.flatMap(q => q.attempts.map(a => ({ quizId: q.id, title: q.title, ...a })));
  const flashSets = db.data.flashcardSets.filter(s => s.userId === req.user.id);
  const pomo = db.data.pomodoroSessions.filter(s => s.userId === req.user.id);
  res.json({
    progress: p,
    streak,
    totals: {
      materials: db.data.materials.filter(m => m.userId === req.user.id).length,
      quizzes: quizzes.length,
      flashcardSets: flashSets.length,
      pomodoroMinutes: pomo.reduce((a,s)=>a+(s.duration||0),0)
    },
    attempts: attempts.slice(-30),
    topics: p.topics || {}
  });
});

export default router;
