import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const file = path.join(dataDir, 'db.json');

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

export async function initDb() {
  try { mkdirSync(dataDir, { recursive: true }); } catch {}
  const adapter = new JSONFile(file);
  db = new Low(adapter, defaultData);
  await db.read();
  db.data ||= defaultData;
  for (const k of Object.keys(defaultData)) {
    if (db.data[k] === undefined) db.data[k] = defaultData[k];
  }
  await db.write();
  return db;
}

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

export async function save() {
  await db.write();
}
