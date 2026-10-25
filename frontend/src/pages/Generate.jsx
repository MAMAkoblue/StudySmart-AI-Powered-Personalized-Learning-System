import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Generate() {
  const [materials, setMaterials] = useState([]);
  const [materialId, setMaterialId] = useState('');
  const [type, setType] = useState('quiz');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { api.get('/materials').then(r => setMaterials(r.data)); }, []);

  const generate = async () => {
    if (!materialId) return toast.error('Select a material');
    setLoading(true);
    setResult(null);
    try {
      const endpoint = type === 'quiz' ? '/generate/quiz' : '/generate/flashcards';
      const r = await api.post(endpoint, { materialId, count });
      setResult(r.data);
      toast.success('Generated!');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Generate Reviewer</h1>
      <div className="card max-w-2xl">
        <label className="block text-sm font-medium text-slate-600 mb-1">Material</label>
        <select className="input mb-4" value={materialId} onChange={e => setMaterialId(e.target.value)}>
          <option value="">Select material...</option>
          {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
        <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setType('quiz')} className={`px-4 py-2 rounded-xl text-sm ${type === 'quiz' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`}>Quiz</button>
          <button onClick={() => setType('flashcards')} className={`px-4 py-2 rounded-xl text-sm ${type === 'flashcards' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`}>Flashcards</button>
        </div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Count</label>
        <input type="number" min={3} max={30} className="input mb-4" value={count} onChange={e => setCount(Number(e.target.value))} />
        <button onClick={generate} disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="animate-spin" size={18}/> Generating...</> : <><Sparkles size={18}/> Generate</>}
        </button>
      </div>

      {result && (
        <div className="card mt-6">
          <h2 className="font-semibold mb-2">{result.title}</h2>
          {type === 'quiz' ? (
            <div>
              <p className="text-sm text-slate-500 mb-3">{result.questions.length} questions generated.</p>
              <Link to="/quizzes" className="btn-primary">Go to Quizzes</Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-500 mb-3">{result.cards.length} flashcards generated.</p>
              <Link to="/flashcards" className="btn-primary">Go to Flashcards</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
