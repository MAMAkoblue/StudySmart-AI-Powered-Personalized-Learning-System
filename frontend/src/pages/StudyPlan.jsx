import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { CalendarDays, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudyPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const r = await api.get('/studyplans/latest');
    setPlan(r.data);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setLoading(true);
    try { const r = await api.post('/studyplans/generate'); setPlan(r.data); toast.success('Plan created'); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Personalized Study Plan</h1>
        <button onClick={generate} disabled={loading} className="btn-primary"><Sparkles size={16}/> {loading ? 'Building...' : 'Generate plan'}</button>
      </div>
      {!plan && <div className="text-slate-400">No plan yet. Generate one based on your performance.</div>}
      {plan && (
        <div>
          {plan.plan.recommendation && <div className="card mb-4 bg-brand-50 border-brand-200"><div className="font-medium text-brand-700">{plan.plan.recommendation}</div></div>}
          {plan.plan.weakTopics?.length > 0 && (
            <div className="card mb-4">
              <h3 className="font-semibold mb-2">Weak topics to focus</h3>
              <div className="flex flex-wrap gap-2">
                {plan.plan.weakTopics.map(w => <span key={w.topic} className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm">{w.topic} ({Math.round((w.accuracy||0)*100)}%)</span>)}
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.plan.days.map(d => (
              <div key={d.day} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="text-brand-600" />
                  <h3 className="font-semibold">Day {d.day}</h3>
                </div>
                <div className="text-sm text-slate-600 mb-2 font-medium">{d.focus}</div>
                <ul className="text-sm text-slate-500 space-y-1">
                  {d.tasks.map((t, i) => <li key={i}>• {t.label} ({t.minutes} min)</li>)}
                </ul>
                <div className="text-xs text-slate-400 mt-2">{d.pomodoro} pomodoro sessions</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
