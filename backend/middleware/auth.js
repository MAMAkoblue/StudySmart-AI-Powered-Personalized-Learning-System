import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb, save } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'studysmart-secret-change-in-prod';

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
}

export function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'No token' });
  const token = h.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const db = getDb();
  if (db.data.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, password: hash, createdAt: new Date().toISOString() };
  db.data.users.push(user);
  db.data.progress[user.id] = { quizzesTaken: 0, correct: 0, total: 0, topics: {}, sessions: [], flashcardsReviewed: 0 };
  db.data.streaks[user.id] = { current: 0, longest: 0, lastDate: null };
  await save();
  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const db = getDb();
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

export async function me(req, res) {
  const db = getDb();
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user.id, name: user.name, email: user.email });
}
