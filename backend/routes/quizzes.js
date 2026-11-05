import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, save } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const list = db.data.quizzes.filter(q => q.userId === req.user.id).map(q => ({
    id: q.id, title: q.title, materialId: q.materialId, questionCount: (q.questions || []).length, createdAt: q.createdAt, attempts: (q.attempts || []).length
  }));
  res.json(list);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const q = db.data.quizzes.find(x => x.id === req.params.id && x.userId === req.user.id);
  if (!q) return res.status(404).json({ error: 'Not found' });
  // hide answer? keep for client grading but frontend can grade; send answers
  res.json(q);
});

router.post('/:id/submit', async (req, res) => {
  const { answers } = req.body; // { questionId: selectedOption }
  const db = getDb();
  const q = db.data.quizzes.find(x => x.id === req.params.id && x.userId === req.user.id);
  if (!q) return res.status(404).json({ error: 'Not found' });
  const qs = Array.isArray(q.questions) ? q.questions : [];
  let correct = 0;
  const results = qs.map(qu => {
    const sel = answers?.[qu.id];
    const isCorrect = sel === qu.answer;
    if (isCorrect) correct++;
    return { questionId: qu.id, selected: sel, correct: qu.answer, isCorrect, explanation: qu.explanation };
  });
  const attempt = { id: uuidv4(), score: correct, total: qs.length, submittedAt: new Date().toISOString(), results };
  q.attempts = Array.isArray(q.attempts) ? q.attempts : [];
  q.attempts.push(attempt);

  // update progress
  if (!db.data.progress[req.user.id]) {
    db.data.progress[req.user.id] = { quizzesTaken: 0, correct: 0, total: 0, topics: {}, sessions: [], flashcardsReviewed: 0 };
  }
  const p = db.data.progress[req.user.id];
  p.quizzesTaken = (p.quizzesTaken || 0) + 1;
  p.correct = (p.correct || 0) + correct;
  p.total = (p.total || 0) + qs.length;
  const topic = q.title;
  p.topics = p.topics || {};
  p.topics[topic] = p.topics[topic] || { correct: 0, total: 0 };
  p.topics[topic].correct += correct;
  p.topics[topic].total += qs.length;
  p.sessions = p.sessions || [];
  p.sessions.push({ type: 'quiz', score: correct, total: qs.length, date: new Date().toISOString() });
  // streak
  updateStreak(db, req.user.id);
  await save();
  res.json({ score: correct, total: qs.length, results });
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
