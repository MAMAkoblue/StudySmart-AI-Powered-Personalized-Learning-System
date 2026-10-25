import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, verify, resendCode } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.unverified) {
        setPendingEmail(email);
        try {
          const r = await resendCode(email);
          if (r.devCode) setDevCode(r.devCode);
          toast.success('Please verify your email. A code has been sent.');
        } catch {}
      } else {
        toast.error(data?.error || 'Login failed');
      }
    } finally { setLoading(false); }
  };

  const verifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verify(pendingEmail, code);
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try {
      const data = await resendCode(pendingEmail);
      if (data.devCode) setDevCode(data.devCode);
      toast.success(data.message || 'Code sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Resend failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-100 via-purple-100 to-pink-100 p-4">
      <div className="w-full max-w-md card">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white"><Brain size={26}/></div>
          <h1 className="text-2xl font-bold text-slate-800">StudySmart</h1>
        </div>

        {!pendingEmail ? (
          <>
            <h2 className="text-lg font-semibold mb-4 text-center text-slate-700">Welcome back</h2>
            <form onSubmit={submit} className="space-y-4">
              <input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
              <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
              <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-2 text-center text-slate-700">Verify your email</h2>
            <p className="text-sm text-center text-slate-500 mb-4">Enter the code sent to <b>{pendingEmail}</b>.</p>
            {devCode && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
                Dev mode code: <b>{devCode}</b>
              </div>
            )}
            <form onSubmit={verifySubmit} className="space-y-4">
              <input className="input text-center tracking-widest text-lg" placeholder="123456" value={code} onChange={e=>setCode(e.target.value)} required maxLength={6} />
              <button className="btn-primary w-full" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
            </form>
            <button onClick={resend} className="w-full mt-3 text-sm text-brand-600 font-medium">Resend code</button>
          </>
        )}

        <p className="text-sm text-center text-slate-500 mt-4">No account? <Link to="/register" className="text-brand-600 font-medium">Create one</Link></p>
      </div>
    </div>
  );
}
