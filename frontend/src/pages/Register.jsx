import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await register(name, email, password); nav('/'); } catch (err) { toast.error(err.response?.data?.error || 'Register failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-100 via-purple-100 to-pink-100 p-4">
      <div className="w-full max-w-md card">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white"><Brain size={26}/></div>
          <h1 className="text-2xl font-bold text-slate-800">StudySmart</h1>
        </div>
        <h2 className="text-lg font-semibold mb-4 text-center text-slate-700">Create your account</h2>
        <form onSubmit={submit} className="space-y-4">
          <input className="input" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
          <input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </form>
        <p className="text-sm text-center text-slate-500 mt-4">Have an account? <Link to="/login" className="text-brand-600 font-medium">Sign in</Link></p>
      </div>
    </div>
  );
}
