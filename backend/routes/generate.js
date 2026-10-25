import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, save } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateQuiz, generateFlashcards } from '../services/aiService.js';

const router = Router();
router.use(authMiddleware);

router.post('/quiz', async (req, res) => {
  const { materialId, count = 10 } = req.body;
  const db = getDb();
  const mat = db.data.materials.find(m => m.id === materialId && m.userId === req.user.id);
  if (!mat) return res.status(404).json({ error: 'Material not found' });
  const questions = await generateQuiz(mat.text, count);
  const quiz = { id: uuidv4(), userId: req.user.id, materialId, title: `Quiz: ${mat.title}`, questions, createdAt: new Date().toISOString(), attempts: [] };
  db.data.quizzes.push(quiz);
  await save();
  res.json(quiz);
});

router.post('/flashcards', async (req, res) => {
  const { materialId, count = 12 } = req.body;
  const db = getDb();
  const mat = db.data.materials.find(m => m.id === materialId && m.userId === req.user.id);
  if (!mat) return res.status(404).json({ error: 'Material not found' });
  const cards = await generateFlashcards(mat.text, count);
  const set = { id: uuidv4(), userId: req.user.id, materialId, title: `Flashcards: ${mat.title}`, cards, createdAt: new Date().toISOString() };
  db.data.flashcardSets.push(set);
  await save();
  res.json(set);
});

export default router;
