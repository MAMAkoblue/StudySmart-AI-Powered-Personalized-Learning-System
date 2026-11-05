import { useEffect, useRef, useState } from 'react';
import { api } from '../context/AuthContext';
import { Headphones, Play, Pause, Square, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Listen() {
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState('__all__');
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1.2);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  useEffect(() => { api.get('/materials').then(r => setMaterials(r.data || [])).catch(() => setMaterials([])); }, []);

  const material = selectedId === '__all__'
    ? { id: '__all__', title: 'All materials', text: ((materials || []).map(m => `${m.title}. ${m.text || ''}`).join('\n\n')) }
    : materials.find(m => m.id === selectedId) ?? { id: selectedId, title: 'Unknown', text: '' };

  const wordsRef = useRef([]);
  const utteranceRef = useRef(null);
  const cancelledRef = useRef(false);
  const wordsInTextRef = useRef([]);

  const splitIntoWords = (text) => {
    return text.split(/\s+/).filter(w => w.length > 0);
  };

  const speakFrom = (startIndex) => {
    cancelledRef.current = false;
    const words = wordsInTextRef.current;
    if (startIndex >= words.length) {
      setPlaying(false);
      setPaused(false);
      setCurrentWordIndex(-1);
      return;
    }
    const remainingText = words.slice(startIndex).join(' ');
    const u = new SpeechSynthesisUtterance(remainingText);
    u.rate = rate;
    u.lang = 'en-US';
    utteranceRef.current = u;

    let lastBoundaryIndex = startIndex - 1;

    u.onboundary = (e) => {
      if (cancelledRef.current) return;
      if (e.name !== 'word') return;
      const textSoFar = remainingText.slice(0, e.charIndex);
      const wordIndex = startIndex + splitIntoWords(textSoFar).length - 1;
      if (wordIndex > lastBoundaryIndex && wordIndex < words.length) {
        lastBoundaryIndex = wordIndex;
        setCurrentWordIndex(wordIndex);
      }
    };

    u.onend = () => {
      if (cancelledRef.current) return;
      setPlaying(false);
      setPaused(false);
      setCurrentWordIndex(-1);
      utteranceRef.current = null;
    };

    u.onerror = () => {
      if (cancelledRef.current) return;
      setPlaying(false);
      setPaused(false);
      setCurrentWordIndex(-1);
      utteranceRef.current = null;
    };

    window.speechSynthesis.speak(u);
  };

  const stop = () => {
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    if (utteranceRef.current) utteranceRef.current.onend = null;
    wordsRef.current = [];
    wordsInTextRef.current = [];
    setPlaying(false);
    setPaused(false);
    setCurrentWordIndex(-1);
  };

  const play = () => {
    if (!material?.text) { toast.error('Select a material with content'); return; }
    if (!('speechSynthesis' in window)) { alert('Text-to-speech not supported'); return; }
    stop();
    wordsInTextRef.current = splitIntoWords(material.text);
    setPlaying(true);
    setPaused(false);
    speakFrom(0);
  };

  const handleWordClick = (index) => {
    if (!playing) return;
    stop();
    setPlaying(true);
    setPaused(false);
    speakFrom(index);
  };

  const pauseResume = () => {
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
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
          {(materials || []).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>

        {material && (
          <div className="text-sm text-slate-500 mb-4">
            {(material?.text?.length || 0).toLocaleString()} characters
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
          <p className="text-sm text-slate-600 whitespace-pre-wrap max-h-96 overflow-auto leading-relaxed">
            {(wordsInTextRef.current.length > 0 ? wordsInTextRef.current : splitIntoWords(material.text)).map((word, i) => {
              return (
                <span
                  key={i}
                  onClick={() => handleWordClick(i)}
                  className={`
                    cursor-pointer inline-block rounded px-0.5 transition-colors
                    ${currentWordIndex === i ? 'bg-brand-600 text-white' : 'hover:bg-slate-200 text-slate-600'}
                  `}
                  title="Click to start reading from this word"
                >
                  {word}{i < wordsInTextRef.current.length - 1 ? ' ' : ''}
                </span>
              );
            })}
          </p>
        </div>
      )}
    </div>
  );
}
