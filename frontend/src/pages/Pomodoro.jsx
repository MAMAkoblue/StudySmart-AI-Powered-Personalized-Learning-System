import { useState, useEffect, useRef } from 'react';
import { api } from '../context/AuthContext';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Pomodoro() {
  const [mode, setMode] = useState('focus'); // focus | break
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(null);
  const timerRef = useRef(null);

  const durations = { focus: 25 * 60, break: 5 * 60 };

  useEffect(() => {
    api.get('/pomodoro/stats').then(r => setStats(r.data));
  }, []);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setRunning(false);
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const handleComplete = async () => {
    const dur = mode === 'focus' ? 25 : 5;
    await api.post('/pomodoro/session', { duration: dur, type: mode, completed: true });
    toast.success(mode === 'focus' ? 'Focus session complete! Take a break.' : 'Break over. Back to work!');
    const r = await api.get('/pomodoro/stats'); setStats(r.data);
  };

  const switchMode = (m) => { setMode(m); setSeconds(durations[m]); setRunning(false); };

  const reset = () => { setSeconds(durations[mode]); setRunning(false); };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Pomodoro Timer</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card flex flex-col items-center justify-center py-10">
          <div className="flex gap-2 mb-6">
            <button onClick={() => switchMode('focus')} className={`px-4 py-2 rounded-xl text-sm ${mode === 'focus' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`}>Focus 25m</button>
            <button onClick={() => switchMode('break')} className={`px-4 py-2 rounded-xl text-sm ${mode === 'break' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>Break 5m</button>
          </div>
          <div className={`text-7xl font-bold mb-6 ${mode === 'focus' ? 'text-brand-600' : 'text-emerald-600'}`}>{mm}:{ss}</div>
          <div className="flex gap-3">
            <button onClick={() => setRunning(r => !r)} className="btn-primary px-6">
              {running ? <><Pause size={18}/> Pause</> : <><Play size={18}/> Start</>}
            </button>
            <button onClick={reset} className="btn-ghost"><RotateCcw size={18}/></button>
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Coffee size={18}/> Stats</h3>
          {stats && (
            <>
              <div className="text-3xl font-bold text-slate-800">{stats.count}</div>
              <div className="text-sm text-slate-500 mb-2">sessions completed</div>
              <div className="text-3xl font-bold text-slate-800">{stats.totalMinutes}</div>
              <div className="text-sm text-slate-500 mb-4">total minutes</div>
              <div className="space-y-1 max-h-48 overflow-auto">
                {stats.sessions.map((s, i) => (
                  <div key={i} className="text-xs text-slate-500 flex justify-between border-b border-slate-100 py-1">
                    <span>{s.type} • {s.duration}m</span>
                    <span>{new Date(s.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
