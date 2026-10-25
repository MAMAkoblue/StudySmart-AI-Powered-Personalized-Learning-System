import { v4 as uuidv4 } from 'uuid';

const STOPWORDS = new Set('a an the and or but if then else when while for of to in on at by with from as is are was were be been being have has had do does did can could should would may might must not no nor so yet too very just only also this that these those it its they them their he she his her we us our you your i me my'.split(/\s+/));

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 400);
}

function tokenize(text) {
  return text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || [];
}

function keyTerms(text, n = 30) {
  const freq = {};
  for (const w of tokenize(text)) {
    if (STOPWORDS.has(w)) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(correct, pool, count = 3) {
  const opts = pool.filter(t => t.toLowerCase() !== correct.toLowerCase());
  return shuffle(opts).slice(0, count);
}

export function generateFlashcardsHeuristic(text, count = 12) {
  const sentences = splitSentences(text);
  const terms = keyTerms(text, 40);
  const cards = [];
  const used = new Set();
  for (const s of sentences) {
    if (cards.length >= count) break;
    const term = terms.find(t => new RegExp('\\b' + t + '\\b', 'i').test(s));
    if (!term) continue;
    const re = new RegExp('\\b' + term + '\\b', 'i');
    const blanked = s.replace(re, '______');
    if (blanked === s) continue;
    const key = blanked.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    cards.push({ id: uuidv4(), front: blanked, back: term, hint: 'Fill in the blank' });
  }
  if (cards.length < Math.min(6, sentences.length)) {
    for (const s of sentences) {
      if (cards.length >= count) break;
      cards.push({ id: uuidv4(), front: 'What does this mean?\n"' + s.slice(0, 90) + (s.length > 90 ? '...' : '') + '"', back: s, hint: 'Recall' });
    }
  }
  return cards.slice(0, count);
}

export function generateQuizHeuristic(text, count = 10) {
  const sentences = splitSentences(text);
  const terms = keyTerms(text, 40);
  const questions = [];
  const used = new Set();

  // Type 1: cloze deletion
  for (const s of sentences) {
    if (questions.length >= count) break;
    const term = terms.find(t => new RegExp('\\b' + t + '\\b', 'i').test(s));
    if (!term) continue;
    const re = new RegExp('\\b' + term + '\\b', 'i');
    const stem = s.replace(re, '_____');
    if (stem === s) continue;
    const key = stem.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    const distractors = pickDistractors(term, terms, 3);
    const options = shuffle([term, ...distractors]);
    questions.push({ id: uuidv4(), type: 'cloze', question: stem, options, answer: term, explanation: s });
  }

  // Type 2: exam-style TRUE statement with twisted distractors
  for (const s of sentences) {
    if (questions.length >= count) break;
    // pick a key term to twist
    const term = terms.find(t => new RegExp('\\b' + t + '\\b', 'i').test(s));
    if (!term) continue;
    const others = terms.filter(t => t !== term);
    if (others.length < 3) continue;
    const twisted = [];
    for (let i = 0; i < 3; i++) {
      const t = others[i % others.length];
      twisted.push(s.replace(new RegExp('\\b' + term + '\\b', 'i'), t));
    }
    const key = ('exam:' + s).toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    const options = shuffle([s, ...twisted]);
    questions.push({ id: uuidv4(), type: 'comprehension', question: 'Which of the following statements is TRUE according to the material?', options, answer: s, explanation: s });
  }

  // Fallback: if still short, use sentence-as-answer MCQs
  if (questions.length < Math.min(4, sentences.length)) {
    for (const s of sentences) {
      if (questions.length >= count) break;
      const words = s.split(' ').filter(w => w.length > 4);
      if (words.length < 3) continue;
      const term = words[Math.floor(words.length / 2)];
      const stem = s.replace(term, '_____');
      const distractors = pickDistractors(term, terms, 3);
      const options = shuffle([term, ...distractors]);
      questions.push({ id: uuidv4(), type: 'cloze', question: stem, options, answer: term, explanation: s });
    }
  }

  return shuffle(questions).slice(0, count);
}

async function openaiGenerate(text, type, count) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const prompt = type === 'quiz'
    ? `Generate ${count} exam-style multiple-choice questions from the following study material. Mix recall, comprehension, and application questions. Paraphrase questions; do not just quote sentences. Make distractors plausible but clearly wrong. Return ONLY valid JSON array of objects with keys: question, options (array of 4 strings), answer (correct option string), explanation. Material:\n${text.slice(0, 6000)}`
    : `Generate ${count} flashcards from the following study material. Return ONLY valid JSON array of objects with keys: front, back. Material:\n${text.slice(0, 6000)}`;
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const json = content.match(/\[[\s\S]*\]/)?.[0];
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (type === 'quiz') {
      return parsed.map(q => ({ id: uuidv4(), question: q.question, options: q.options, answer: q.answer, explanation: q.explanation || '' }));
    }
    return parsed.map(c => ({ id: uuidv4(), front: c.front, back: c.back }));
  } catch (e) {
    console.error('OpenAI error', e.message);
    return null;
  }
}

export async function generateQuiz(text, count = 10) {
  const ai = await openaiGenerate(text, 'quiz', count);
  if (ai && ai.length) return ai;
  return generateQuizHeuristic(text, count);
}

export async function generateFlashcards(text, count = 12) {
  const ai = await openaiGenerate(text, 'flashcards', count);
  if (ai && ai.length) return ai;
  return generateFlashcardsHeuristic(text, count);
}

export function generateStudyPlan(materials, progress) {
  const weak = [];
  if (progress && progress.topics) {
    for (const [topic, stat] of Object.entries(progress.topics)) {
      const acc = stat.total ? stat.correct / stat.total : 0;
      if (acc < 0.7 || stat.total < 3) weak.push({ topic, accuracy: acc, total: stat.total });
    }
  }
  weak.sort((a, b) => a.accuracy - b.accuracy);
  const days = [];
  const topics = weak.length ? weak.map(w => w.topic) : ['Review core concepts', 'Practice recall', 'Self-test'];
  for (let i = 0; i < 7; i++) {
    const t = topics[i % topics.length];
    days.push({
      day: i + 1,
      focus: t,
      tasks: [
        { type: 'flashcards', minutes: 15, label: 'Review flashcards' },
        { type: 'quiz', minutes: 15, label: 'Practice quiz' },
        { type: 'reading', minutes: 20, label: 'Re-read material' }
      ],
      pomodoro: 2
    });
  }
  return { days, weakTopics: weak.slice(0, 5), recommendation: weak.length ? `Focus on: ${weak.slice(0,3).map(w=>w.topic).join(', ')}` : 'Great job! Keep reviewing to maintain streak.' };
}

