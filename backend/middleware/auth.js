import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb, save } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

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

function createTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
  }
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return null;
}

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendVerificationEmail(email, code) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@studysmart.app';
  const mail = {
    from,
    to: email,
    subject: 'Your StudySmart verification code',
    text: `Your StudySmart verification code is: ${code}\n\nIt expires in 15 minutes.`,
    html: `<p>Your StudySmart verification code is: <b>${code}</b></p><p>It expires in 15 minutes.</p>`
  };
  if (!transporter) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return { sent: false };
  }
  try {
    await transporter.sendMail(mail);
    return { sent: true };
  } catch (e) {
    console.error('Email send failed:', e.message);
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return { sent: false };
  }
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const db = getDb();
  const existing = db.data.users.find(u => u.email === email);
  const code = genCode();
  const expires = Date.now() + 15 * 60 * 1000;
  const hash = await bcrypt.hash(password, 10);

  if (existing) {
    if (existing.verified) return res.status(400).json({ error: 'Email already registered' });
    existing.name = name;
    existing.password = hash;
    existing.verified = false;
    existing.verifyCode = code;
    existing.verifyExpires = expires;
  } else {
    const user = { id: uuidv4(), name, email, password: hash, createdAt: new Date().toISOString(), verified: false, verifyCode: code, verifyExpires: expires };
    db.data.users.push(user);
    db.data.progress[user.id] = { quizzesTaken: 0, correct: 0, total: 0, topics: {}, sessions: [], flashcardsReviewed: 0 };
    db.data.streaks[user.id] = { current: 0, longest: 0, lastDate: null };
  }
  await save();

  const result = await sendVerificationEmail(email, code);
  const response = { pending: true, email, message: result.sent ? 'Verification code sent to your email' : 'Email not configured; use the code shown' };
  if (!result.sent) response.devCode = code;
  res.json(response);
}

export async function verify(req, res) {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Missing fields' });
  const db = getDb();
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: 'User not found' });
  if (user.verified) {
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  }
  if (!user.verifyCode || user.verifyCode !== String(code).trim()) {
    return res.status(400).json({ error: 'Invalid code' });
  }
  if (Date.now() > (user.verifyExpires || 0)) {
    return res.status(400).json({ error: 'Code expired. Please resend.' });
  }
  user.verified = true;
  user.verifyCode = null;
  user.verifyExpires = null;
  await save();
  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

export async function resendCode(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const db = getDb();
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: 'User not found' });
  if (user.verified) return res.json({ message: 'Already verified' });
  const code = genCode();
  user.verifyCode = code;
  user.verifyExpires = Date.now() + 15 * 60 * 1000;
  await save();
  const result = await sendVerificationEmail(email, code);
  const response = { message: result.sent ? 'Code sent' : 'Email not configured; use the code shown' };
  if (!result.sent) response.devCode = code;
  res.json(response);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const db = getDb();
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  if (user.verified === false) return res.status(403).json({ error: 'Email not verified', unverified: true });
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