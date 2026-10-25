import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Layers, RotateCw } from 'lucide-react';

export default function Flashcards() {
  const [sets, setSets] = useState([]);
  const [active, setActive] = useState(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => { api.get('/flashcards').then(r => setSets(r.data)); }, []);

  const openSet = async (id) => {
    const r = await api.get(`/flashcards/${id}`);
    setActive(r.data);
    setIdx(0);
    setFlipped(false);
  };

  const markReviewed = async (reviewed) => {
    if (active) await api.post(`/flashcards/${active.id}/review`, { reviewed });
  };

  if (active) {
    const card = active.cards[idx];
    const done = idx >= active.cards.length;
    if (done) {
      return (
        <div className="card text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">All done! 🎉</h2>
          <p className="text-slate-500 mb-4">You reviewed {active.cards.length} cards.</p>
          <button onClick={() => { markReviewed(active.cards.length); setActive(null); }} className="btn-primary">Back to sets</button>
        </div>
      );
    }
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setActive(null)} className="btn-ghost">← Back</button>
          <span className="text-sm text-slate-500">{idx + 1} / {active.cards.length}</span>
        </div>
        <div className="card min-h-[260px] flex flex-col items-center justify-center text-center cursor-pointer" onClick={() => setFlipped(f => !f)}>
          <div className="text-lg font-medium text-slate-800 mb-2">{flipped ? card.back : card.front}</div>
          {!flipped && card.hint && <div className="text-xs text-slate-400">{card.hint}</div>}
          <div className="text-xs text-slate-400 mt-4 flex items-center gap-1"><RotateCw size={12}/> Click to flip</div>
        </div>
        <div className="flex gap-3 mt-4 justify-center">
          <button onClick={() => { setFlipped(false); setIdx(i => i + 1); }} className="btn-ghost">Skip</button>
          <button onClick={() => { setFlipped(false); setIdx(i => i + 1); }} className="btn-primary">Got it ✓</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Flashcards</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {sets.map(s => (
          <div key={s.id} className="card">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="text-brand-600" />
              <h3 className="font-semibold text-slate-800">{s.title}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-3">{s.cardCount} cards</p>
            <button onClick={() => openSet(s.id)} className="btn-primary">Review</button>
          </div>
        ))}
        {sets.length === 0 && <div className="text-slate-400">No flashcards yet. Generate some!</div>}
      </div>
    </div>
  );
}
