import { useEffect, useRef, useState } from 'react';
import { api } from '../context/AuthContext';
import { Headphones, Play, Pause, Square, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Listen() {
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState('__all__');
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => { api.get('/materials').then(r => setMaterials(r.data)); }, []);

  const material = selectedId === '__all__'
    ? { id: '__all__', title: 'All materials', text: materials.map(m => `${m.title}. ${m.text}`).join('\n\n') }
    : materials.find(m => m.id === selectedId);

  const chunksRef = useRef([]);
  const indexRef = useRef(0);
  const rateRef = useRef(rate);
  useEffect(() => { rateRef.current = rate; }, [rate]);

  const splitChunks = (text) => {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const chunks = [];
    let current = '';
    for (const s of sentences) {
      if ((current + s).length > 200) {
        if (current) chunks.push(current.trim());
        current = s;
      } else {
        current += s;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length ? chunks : [text];
  };

  const speakNext = () => {
    const chunks = chunksRef.current;
    const i = indexRef.current;
    if (i >= chunks.length) {
      setPlaying(false);
      setPaused(false);
      indexRef.current = 0;
      return;
    }
    const u = new SpeechSynthesisUtterance(chunks[i]);
    u.rate = rateRef.current;
    u.onend = () => {
      indexRef.current += 1;
      if (indexRef.current < chunks.length) speakNext();
      else {
        setPlaying(false);
        setPaused(false);
        indexRef.current = 0;
      }
    };
    u.onerror = () => {
      setPlaying(false);
      setPaused(false);
      indexRef.current = 0;
    };
    window.speechSynthesis.speak(u);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    chunksRef.current = [];
    indexRef.current = 0;
    setPlaying(false);
    setPaused(false);
  };

  const play = () => {
    if (!material?.text) { toast.error('Select a material with content'); return; }
    if (!('speechSynthesis' in window)) { alert('Text-to-speech not supported'); return; }
    window.speechSynthesis.cancel();
    chunksRef.current = splitChunks(material.text);
    indexRef.current = 0;
    setPlaying(true);
    setPaused(false);
    speakNext();
  };

  const pauseResume = () => {
    if (paused) { window.speechSynthesis.resume(); setPaused(false); }
    else { window.speechSynthesis.pause(); setPaused(true); }
  };

  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Listen to Materials</h1>
      <div className="card max-w-2xl mb-6">
        <label className="block text-sm font-medium text-slate-600 mb-1">Material</label>
        <select className="input mb-4" value={selectedId} onChange={e => { stop(); setSelectedId(e.target.value); }}>
          <option value="">Select material...</option>
          <option value="__all__">All materials</option>
          {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>

        {material && (
          <div className="text-sm text-slate-500 mb-4">
            {material.text.length.toLocaleString()} characters
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          {!playing ? (
            <button onClick={play} disabled={!selectedId} className="btn-primary flex items-center gap-2">
              <Play size={18} /> Play
            </button>
          ) : (
            <button onClick={pauseResume} className="btn-primary flex items-center gap-2">
              {paused ? <><Play size={18} /> Resume</> : <><Pause size={18} /> Pause</>}
            </button>
          )}
          <button onClick={stop} disabled={!playing} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-2">
            <Square size={18} /> Stop
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Volume2 size={18} className="text-slate-500" />
          <label className="text-sm text-slate-600">Speed: {rate.toFixed(1)}x</label>
          <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} className="flex-1" />
        </div>
      </div>

      {material && (
        <div className="card max-w-2xl">
          <h2 className="font-semibold mb-2">{material.title}</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap max-h-96 overflow-auto">{material.text}</p>
        </div>
      )}
    </div>
  );
}
