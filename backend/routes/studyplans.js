import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, save } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateStudyPlan } from '../services/aiService.js';

const router = Router();
router.use(authMiddleware);

router.post('/generate', async (req, res) => {
  const db = getDb();
  const mats = db.data.materials.filter(m => m.userId === req.user.id);
  const progress = db.data.progress[req.user.id];
  const plan = generateStudyPlan(mats, progress);
  const sp = { id: uuidv4(), userId: req.user.id, plan, createdAt: new Date().toISOString() };
  db.data.studyPlans.push(sp);
  await save();
  res.json(sp);
});

router.get('/', (req, res) => {
  const db = getDb();
  const plans = db.data.studyPlans.filter(p => p.userId === req.user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  res.json(plans);
});

router.get('/latest', (req, res) => {
  const db = getDb();
  const plans = db.data.studyPlans.filter(p => p.userId === req.user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  res.json(plans[0] || null);
});

export default router;
