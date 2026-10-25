import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, 'data', 'db.json');

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
  const adapter = new JSONFile(file);
  db = new Low(adapter, defaultData);
  await db.read();
  db.data ||= defaultData;
  // ensure keys
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
