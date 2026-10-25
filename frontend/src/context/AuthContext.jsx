import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API = import.meta.env.VITE_API_URL || '/api';
export const api = axios.create({ baseURL: API, timeout: 15000 });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me').then(r => setUser(r.data)).catch(() => { setToken(null); localStorage.removeItem('token'); }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', r.data.token);
    setToken(r.data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
    setUser(r.data.user);
    return r.data;
  };
  const register = async (name, email, password) => {
    const r = await api.post('/auth/register', { name, email, password });
    return r.data;
  };

  const verify = async (email, code) => {
    const r = await api.post('/auth/verify', { email, code });
    localStorage.setItem('token', r.data.token);
    setToken(r.data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
    setUser(r.data.user);
    return r.data;
  };

  const resendCode = async (email) => {
    const r = await api.post('/auth/resend-code', { email });
    return r.data;
  };
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return <AuthContext.Provider value={{ user, token, loading, login, register, verify, resendCode, logout }}>{children}</AuthContext.Provider>;
}
