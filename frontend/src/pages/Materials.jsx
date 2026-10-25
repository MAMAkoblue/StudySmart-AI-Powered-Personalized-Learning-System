import { useEffect, useState, useRef } from 'react';
import { api } from '../context/AuthContext';
import { Upload, FileText, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [mode, setMode] = useState('file');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => api.get('/materials').then(r => setMaterials(r.data));
  useEffect(load, []);

  const uploadFile = async () => {
    const f = fileRef.current.files[0];
    if (!f) return toast.error('Select a file');
    const fd = new FormData();
    fd.append('file', f);
    if (title) fd.append('title', title);
    setUploading(true);
    try { await api.post('/materials/upload', fd); toast.success('Uploaded'); load(); setTitle(''); fileRef.current.value = ''; }
    catch (e) { toast.error(e.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const pasteText = async () => {
    if (!text.trim()) return toast.error('Enter text');
    setUploading(true);
    try { await api.post('/materials/text', { title: title || 'Pasted text', text }); toast.success('Saved'); load(); setTitle(''); setText(''); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setUploading(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete material?')) return;
    await api.delete(`/materials/${id}`); load();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Study Materials</h1>
      <div className="card mb-6">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('file')} className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'file' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`}>Upload file</button>
          <button onClick={() => setMode('text')} className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'text' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`}>Paste text</button>
        </div>
        <input className="input mb-3" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
        {mode === 'file' ? (
          <div className="flex gap-3 items-center">
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="text-sm" />
            <button onClick={uploadFile} disabled={uploading} className="btn-primary"><Upload size={16}/> {uploading ? 'Uploading...' : 'Upload'}</button>
          </div>
        ) : (
          <div>
            <textarea className="input mb-3" rows={6} placeholder="Paste your reading material..." value={text} onChange={e => setText(e.target.value)} />
            <button onClick={pasteText} disabled={uploading} className="btn-primary"><Plus size={16}/> Save</button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {materials.map(m => (
          <div key={m.id} className="card flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center"><FileText size={20}/></div>
              <div>
                <div className="font-semibold text-slate-800">{m.title}</div>
                <div className="text-xs text-slate-500">{m.filename || 'text'} • {new Date(m.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <button onClick={() => remove(m.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={18}/></button>
          </div>
        ))}
        {materials.length === 0 && <div className="text-slate-400 col-span-2">No materials yet.</div>}
      </div>
    </div>
  );
}
