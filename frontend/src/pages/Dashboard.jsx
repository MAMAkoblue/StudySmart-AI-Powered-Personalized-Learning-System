import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Flame, BookOpen, ClipboardList, Layers, Timer, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/analytics').then(r => setData(r.data)).catch(() => setData(null)); }, []);
  if (!data) return <div className="text-slate-500">Loading...</div>;
  const totals = data.totals || {};
  const progress = data.progress || {};
  const streak = data.streak || { current: 0, longest: 0 };
  const stats = [
    { label: 'Materials', value: totals.materials || 0, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { label: 'Quizzes', value: totals.quizzes || 0, icon: ClipboardList, color: 'from-purple-500 to-pink-500' },
    { label: 'Flashcard Sets', value: totals.flashcardSets || 0, icon: Layers, color: 'from-amber-500 to-orange-500' },
    { label: 'Study Minutes', value: totals.pomodoroMinutes || 0, icon: Timer, color: 'from-emerald-500 to-teal-500' },
  ];
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Welcome back 👋</h1>
        <p className="text-slate-500 mt-1">Here's your learning overview.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}><s.icon size={22}/></div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-2 mb-2"><Flame className="text-orange-500" /><span className="font-semibold">Streak</span></div>
          <div className="text-4xl font-bold text-slate-800">{streak.current || 0}</div>
          <div className="text-xs text-slate-500">days • longest {streak.longest || 0}</div>
        </div>
        <div className="card">
          <div className="font-semibold mb-2">Accuracy</div>
          <div className="text-4xl font-bold text-slate-800">
            {progress.total ? Math.round((progress.correct / progress.total) * 100) : 0}%
          </div>
          <div className="text-xs text-slate-500">{progress.correct || 0}/{progress.total || 0} correct</div>
        </div>
        <div className="card">
          <div className="font-semibold mb-2">Quizzes taken</div>
          <div className="text-4xl font-bold text-slate-800">{progress.quizzesTaken || 0}</div>
          <div className="text-xs text-slate-500">keep going!</div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/materials" className="btn-ghost"><BookOpen size={16}/> Upload material</Link>
          <Link to="/generate" className="btn-primary"><Sparkles size={16}/> Generate reviewer</Link>
          <Link to="/pomodoro" className="btn-ghost"><Timer size={16}/> Start Pomodoro</Link>
          <Link to="/studyplan" className="btn-ghost"><Sparkles size={16}/> Build study plan</Link>
        </div>
      </div>
    </div>
  );
}
