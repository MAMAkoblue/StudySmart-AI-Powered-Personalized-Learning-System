import { Router } from 'express';
import { getDb, save } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const list = db.data.flashcardSets.filter(s => s.userId === req.user.id).map(s => ({
    id: s.id, title: s.title, materialId: s.materialId, cardCount: s.cards.length, createdAt: s.createdAt
  }));
  res.json(list);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const s = db.data.flashcardSets.find(x => x.id === req.params.id && x.userId === req.user.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

router.post('/:id/review', async (req, res) => {
  const { known } = req.body; // count known
  const db = getDb();
  const p = db.data.progress[req.user.id];
  if (p) {
    p.flashcardsReviewed = (p.flashcardsReviewed || 0) + (req.body.reviewed || 0);
    p.sessions.push({ type: 'flashcards', reviewed: req.body.reviewed || 0, date: new Date().toISOString() });
  }
  updateStreak(db, req.user.id);
  await save();
  res.json({ ok: true });
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
