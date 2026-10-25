import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { getDb, save } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { extractText } from '../services/textExtract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const mats = db.data.materials.filter(m => m.userId === req.user.id);
  res.json(mats);
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file' });
    const fs = await import('fs');
    const buffer = fs.readFileSync(file.path);
    const text = await extractText(buffer, file.mimetype, file.originalname);
    const db = getDb();
    const mat = {
      id: uuidv4(),
      userId: req.user.id,
      title: req.body.title || file.originalname,
      filename: file.originalname,
      mimetype: file.mimetype,
      text,
      createdAt: new Date().toISOString()
    };
    db.data.materials.push(mat);
    await save();
    // cleanup file
    try { fs.unlinkSync(file.path); } catch {}
    res.json({ id: mat.id, title: mat.title, length: text.length, createdAt: mat.createdAt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/text', async (req, res) => {
  const { title, text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text' });
  const db = getDb();
  const mat = { id: uuidv4(), userId: req.user.id, title: title || 'Pasted text', filename: null, mimetype: 'text/plain', text, createdAt: new Date().toISOString() };
  db.data.materials.push(mat);
  await save();
  res.json({ id: mat.id, title: mat.title, length: text.length });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const mat = db.data.materials.find(m => m.id === req.params.id && m.userId === req.user.id);
  if (!mat) return res.status(404).json({ error: 'Not found' });
  res.json(mat);
});

router.delete('/:id', async (req, res) => {
  const db = getDb();
  const idx = db.data.materials.findIndex(m => m.id === req.params.id && m.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.data.materials.splice(idx, 1);
  await save();
  res.json({ ok: true });
});

export default router;
