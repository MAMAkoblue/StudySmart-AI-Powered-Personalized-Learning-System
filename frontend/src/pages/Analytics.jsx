import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/analytics').then(r => setData(r.data)); }, []);
  if (!data) return <div className="text-slate-500">Loading...</div>;

  const topicData = Object.entries(data.topics || {}).map(([k, v]) => ({ name: k.slice(0, 20), accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0, total: v.total }));

  const attempts = data.attempts || [];
  const scoreData = attempts.map((a, i) => ({ name: `#${i + 1}`, score: a.total ? Math.round((a.score / a.total) * 100) : 0 }));

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Progress Analytics</h1>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Quiz scores over time</h3>
          {scoreData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scoreData}>
                <XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip />
                <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-slate-400 text-sm">No attempts yet.</div>}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Topic accuracy</h3>
          {topicData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={topicData} dataKey="accuracy" nameKey="name" outerRadius={90} label>
                  {topicData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-slate-400 text-sm">No topic data yet.</div>}
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3">Topic breakdown</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500"><th className="py-2">Topic</th><th>Correct</th><th>Total</th><th>Accuracy</th></tr></thead>
          <tbody>
            {topicData.map(t => (
              <tr key={t.name} className="border-t border-slate-100">
                <td className="py-2">{t.name}</td>
                <td>{t.total ? Math.round(t.accuracy * t.total / 100) : 0}</td>
                <td>{t.total}</td>
                <td>{t.accuracy}%</td>
              </tr>
            ))}
            {topicData.length === 0 && <tr><td colSpan={4} className="text-slate-400 py-2">No data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
