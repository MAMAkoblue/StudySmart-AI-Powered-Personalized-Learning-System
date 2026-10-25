import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TakeQuiz() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { api.get(`/quizzes/${id}`).then(r => setQuiz(r.data)); }, [id]);

  if (!quiz) return <div className="text-slate-500">Loading...</div>;

  const select = (qid, opt) => setAnswers(a => ({ ...a, [qid]: opt }));

  const speak = (text) => {
    if (!('speechSynthesis' in window)) { alert('Text-to-speech not supported in this browser.'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  const submit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      if (!confirm('Some questions unanswered. Submit anyway?')) return;
    }
    setSubmitting(true);
    try {
      const r = await api.post(`/quizzes/${id}/submit`, { answers });
      setResult(r.data);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (result) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Results</h1>
        <div className="card mb-6">
          <div className="text-4xl font-bold text-brand-600">{result.score}/{result.total}</div>
          <div className="text-slate-500">{Math.round((result.score / result.total) * 100)}% correct</div>
        </div>
        <div className="space-y-4">
          {result.results.map((r, i) => (
            <div key={r.questionId} className={`card border-l-4 ${r.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
              <div className="font-medium text-slate-800 mb-2">{i + 1}. {quiz.questions.find(q => q.id === r.questionId)?.question}</div>
              <div className="text-sm">
                <span className={r.isCorrect ? 'text-green-600' : 'text-red-600'}>Your answer: {r.selected || '(none)'}</span>
                {!r.isCorrect && <span className="ml-3 text-slate-600">Correct: {r.correct}</span>}
              </div>
              {r.explanation && <div className="text-xs text-slate-500 mt-2 italic">{r.explanation}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{quiz.title}</h1>
      <div className="space-y-6">
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="card">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="font-medium text-slate-800">{i + 1}. {q.question}</div>
              <button onClick={() => speak(`${q.question}. Options: ${q.options.join('. ')}`)} className="shrink-0 p-2 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-600 hover:text-brand-600 transition" title="Read aloud">
                <Volume2 size={18} />
              </button>
            </div>
            <div className="grid gap-2">
              {q.options.map(opt => (
                <button key={opt} onClick={() => select(q.id, opt)}
                  className={`text-left px-4 py-2.5 rounded-xl border transition ${answers[q.id] === opt ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button onClick={submit} disabled={submitting} className="btn-primary">{submitting ? 'Submitting...' : 'Submit quiz'}</button>
      </div>
    </div>
  );
}
