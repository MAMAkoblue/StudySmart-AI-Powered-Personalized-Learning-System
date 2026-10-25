import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, BookOpen, Sparkles, ClipboardList, Layers, CalendarDays, Timer, BarChart3, LogOut, Brain, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/materials', label: 'Materials', icon: BookOpen },
  { to: '/generate', label: 'Generate', icon: Sparkles },
  { to: '/quizzes', label: 'Quizzes', icon: ClipboardList },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/studyplan', label: 'Study Plan', icon: CalendarDays },
  { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { to: '/listen', label: 'Listen', icon: Headphones },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/40">
      <aside className="w-64 bg-white/80 backdrop-blur border-r border-slate-200 p-5 flex flex-col gap-2 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white"><Brain size={22}/></div>
          <div>
            <div className="font-bold text-slate-800">StudySmart</div>
            <div className="text-xs text-slate-500">AI Learning</div>
          </div>
        </div>
        {nav.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
            <n.icon size={18} /> {n.label}
          </NavLink>
        ))}
        <div className="mt-auto pt-4 border-t border-slate-200">
          <div className="text-sm font-medium text-slate-700 mb-2">{user?.name}</div>
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
