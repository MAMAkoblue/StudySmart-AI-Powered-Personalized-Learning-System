import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Generate from './pages/Generate';
import Quizzes from './pages/Quizzes';
import TakeQuiz from './pages/TakeQuiz';
import Flashcards from './pages/Flashcards';
import StudyPlan from './pages/StudyPlan';
import Pomodoro from './pages/Pomodoro';
import Analytics from './pages/Analytics';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="materials" element={<Materials />} />
        <Route path="generate" element={<Generate />} />
        <Route path="quizzes" element={<Quizzes />} />
        <Route path="quizzes/:id" element={<TakeQuiz />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="studyplan" element={<StudyPlan />} />
        <Route path="pomodoro" element={<Pomodoro />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
    </>
  );
}
