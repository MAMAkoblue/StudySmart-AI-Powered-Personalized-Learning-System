import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync, readFileSync, renameSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const file = path.join(dataDir, 'db.sqlite');

const defaultData = {
  users: [],
  materials: [],
  quizzes: [],
  flashcardSets: [],
  studyPlans: [],
  pomodoroSessions: [],
  progress: {},
  streaks: {}
};

let db;
let data;

function safeJson(value, fallback) {
  if (value == null) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      createdAt TEXT,
      verified INTEGER DEFAULT 0,
      verifyCode TEXT,
      verifyExpires INTEGER
    );
    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      userId TEXT,
      title TEXT,
      filename TEXT,
      mimetype TEXT,
      text TEXT,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      userId TEXT,
      materialId TEXT,
      title TEXT,
      questions TEXT,
      createdAt TEXT,
      attempts TEXT
    );
    CREATE TABLE IF NOT EXISTS flashcard_sets (
      id TEXT PRIMARY KEY,
      userId TEXT,
      materialId TEXT,
      title TEXT,
      cards TEXT,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY,
      userId TEXT,
      plan TEXT,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      userId TEXT,
      duration INTEGER,
      type TEXT,
      completed INTEGER DEFAULT 1,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS progress (
      userId TEXT PRIMARY KEY,
      quizzesTaken INTEGER DEFAULT 0,
      correct INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      topics TEXT,
      sessions TEXT,
      flashcardsReviewed INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS streaks (
      userId TEXT PRIMARY KEY,
      current INTEGER DEFAULT 0,
      longest INTEGER DEFAULT 0,
      lastDate TEXT
    );
  `);
}

function loadAll() {
  const users = db.prepare('SELECT * FROM users').all().map(r => ({
    id: r.id, name: r.name, email: r.email, password: r.password,
    createdAt: r.createdAt, verified: r.verified !== 0,
    verifyCode: r.verifyCode, verifyExpires: r.verifyExpires
  }));
  const materials = db.prepare('SELECT * FROM materials').all().map(r => ({
    id: r.id, userId: r.userId, title: r.title, filename: r.filename,
    mimetype: r.mimetype, text: r.text, createdAt: r.createdAt
  }));
  const quizzes = db.prepare('SELECT * FROM quizzes').all().map(r => ({
    id: r.id, userId: r.userId, materialId: r.materialId, title: r.title,
    questions: safeJson(r.questions, []),
    createdAt: r.createdAt,
    attempts: safeJson(r.attempts, [])
  }));
  const flashcardSets = db.prepare('SELECT * FROM flashcard_sets').all().map(r => ({
    id: r.id, userId: r.userId, materialId: r.materialId, title: r.title,
    cards: safeJson(r.cards, []),
    createdAt: r.createdAt
  }));
  const studyPlans = db.prepare('SELECT * FROM study_plans').all().map(r => ({
    id: r.id, userId: r.userId, plan: safeJson(r.plan, null),
    createdAt: r.createdAt
  }));
  const pomodoroSessions = db.prepare('SELECT * FROM pomodoro_sessions').all().map(r => ({
    id: r.id, userId: r.userId, duration: r.duration, type: r.type,
    completed: r.completed !== 0, createdAt: r.createdAt
  }));
  const progress = {};
  for (const r of db.prepare('SELECT * FROM progress').all()) {
    progress[r.userId] = {
      quizzesTaken: r.quizzesTaken, correct: r.correct, total: r.total,
      topics: safeJson(r.topics, {}),
      sessions: safeJson(r.sessions, []),
      flashcardsReviewed: r.flashcardsReviewed
    };
  }
  const streaks = {};
  for (const r of db.prepare('SELECT * FROM streaks').all()) {
    streaks[r.userId] = { current: r.current, longest: r.longest, lastDate: r.lastDate };
  }
  return { users, materials, quizzes, flashcardSets, studyPlans, pomodoroSessions, progress, streaks };
}

export async function initDb() {
  mkdirSync(dataDir, { recursive: true });
  db = new DatabaseSync(file);
  try { db.exec('PRAGMA journal_mode = WAL;'); } catch {}
  createSchema();

  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const jsonPath = path.join(dataDir, 'db.json');

  if (count === 0 && existsSync(jsonPath)) {
    try {
      const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
      data = { ...defaultData, ...raw };
      for (const k of Object.keys(defaultData)) if (data[k] === undefined) data[k] = defaultData[k];
      await save();
      try { renameSync(jsonPath, jsonPath + '.bak'); } catch {}
    } catch (e) {
      console.error('JSON migration failed:', e);
      data = { ...defaultData };
      await save();
    }
  } else {
    data = loadAll();
    for (const k of Object.keys(defaultData)) if (data[k] === undefined) data[k] = defaultData[k];
    if (!data.progress) data.progress = {};
    if (!data.streaks) data.streaks = {};
    await save();
  }
  // ensure every user has progress & streak records
  if (!data.progress) data.progress = {};
  if (!data.streaks) data.streaks = {};
  for (const u of data.users || []) {
    if (!data.progress[u.id]) data.progress[u.id] = { quizzesTaken: 0, correct: 0, total: 0, topics: {}, sessions: [], flashcardsReviewed: 0 };
    const p = data.progress[u.id];
    p.quizzesTaken = p.quizzesTaken || 0;
    p.correct = p.correct || 0;
    p.total = p.total || 0;
    p.topics = p.topics || {};
    p.sessions = p.sessions || [];
    p.flashcardsReviewed = p.flashcardsReviewed || 0;
    if (!data.streaks[u.id]) data.streaks[u.id] = { current: 0, longest: 0, lastDate: null };
  }
  await save();
  return { data };
}

export function getDb() {
  if (!data) throw new Error('DB not initialized');
  return { data };
}

export async function save() {
  const d = data;
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec('DELETE FROM users');
    const insUser = db.prepare('INSERT INTO users (id,name,email,password,createdAt,verified,verifyCode,verifyExpires) VALUES (?,?,?,?,?,?,?,?)');
    for (const u of d.users) insUser.run(u.id, u.name, u.email, u.password, u.createdAt, u.verified === false ? 0 : 1, u.verifyCode ?? null, u.verifyExpires ?? null);

    db.exec('DELETE FROM materials');
    const insMat = db.prepare('INSERT INTO materials (id,userId,title,filename,mimetype,text,createdAt) VALUES (?,?,?,?,?,?,?)');
    for (const m of d.materials) insMat.run(m.id, m.userId, m.title, m.filename ?? null, m.mimetype ?? null, m.text ?? null, m.createdAt);

    db.exec('DELETE FROM quizzes');
    const insQuiz = db.prepare('INSERT INTO quizzes (id,userId,materialId,title,questions,createdAt,attempts) VALUES (?,?,?,?,?,?,?)');
    for (const q of d.quizzes) insQuiz.run(q.id, q.userId, q.materialId, q.title, JSON.stringify(q.questions ?? []), q.createdAt, JSON.stringify(q.attempts ?? []));

    db.exec('DELETE FROM flashcard_sets');
    const insFc = db.prepare('INSERT INTO flashcard_sets (id,userId,materialId,title,cards,createdAt) VALUES (?,?,?,?,?,?)');
    for (const s of d.flashcardSets) insFc.run(s.id, s.userId, s.materialId, s.title, JSON.stringify(s.cards ?? []), s.createdAt);

    db.exec('DELETE FROM study_plans');
    const insSp = db.prepare('INSERT INTO study_plans (id,userId,plan,createdAt) VALUES (?,?,?,?)');
    for (const sp of d.studyPlans) insSp.run(sp.id, sp.userId, JSON.stringify(sp.plan ?? null), sp.createdAt);

    db.exec('DELETE FROM pomodoro_sessions');
    const insPomo = db.prepare('INSERT INTO pomodoro_sessions (id,userId,duration,type,completed,createdAt) VALUES (?,?,?,?,?,?)');
    for (const s of d.pomodoroSessions) insPomo.run(s.id, s.userId, s.duration ?? 0, s.type ?? 'focus', s.completed === false ? 0 : 1, s.createdAt);

    db.exec('DELETE FROM progress');
    const insProg = db.prepare('INSERT INTO progress (userId,quizzesTaken,correct,total,topics,sessions,flashcardsReviewed) VALUES (?,?,?,?,?,?,?)');
    for (const [uid, p] of Object.entries(d.progress || {})) {
      insProg.run(uid, p.quizzesTaken || 0, p.correct || 0, p.total || 0, JSON.stringify(p.topics || {}), JSON.stringify(p.sessions || []), p.flashcardsReviewed || 0);
    }

    db.exec('DELETE FROM streaks');
    const insStreak = db.prepare('INSERT INTO streaks (userId,current,longest,lastDate) VALUES (?,?,?,?)');
    for (const [uid, s] of Object.entries(d.streaks || {})) {
      insStreak.run(uid, s.current || 0, s.longest || 0, s.lastDate ?? null);
    }

    db.exec('COMMIT');
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch {}
    throw e;
  }
}

