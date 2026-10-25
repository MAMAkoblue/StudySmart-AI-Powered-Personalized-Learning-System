import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState([]);
  useEffect(() => { api.get('/quizzes').then(r => setQuizzes(r.data)); }, []);
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Quizzes</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {quizzes.map(q => (
          <div key={q.id} className="card">
            <div className="flex items-center gap-3 mb-2">
              <ClipboardList className="text-brand-600" />
              <h3 className="font-semibold text-slate-800">{q.title}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-3">{q.questionCount} questions • {q.attempts} attempt(s)</p>
            <Link to={`/quizzes/${q.id}`} className="btn-primary">Take quiz</Link>
          </div>
        ))}
        {quizzes.length === 0 && <div className="text-slate-400">No quizzes yet. Generate one!</div>}
      </div>
    </div>
  );
}
