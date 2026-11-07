import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout/Layout';
import AuthPage from './pages/Auth/AuthPage';
import Dashboard from './components/Dashboard/Dashboard';
import Projects from './pages/Projects/Projects';
import ProjectPage from './pages/Projects/ProjectPage';
import MyTasks from './pages/MyTasks/MyTasks';

function Private() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center muted">Loading…</div>;
  return user ? <Layout /> : <Navigate to="/login" replace />;
}
function Guest() { const { user } = useAuth(); return user ? <Navigate to="/" replace /> : <Outlet />; }

export default function App() {
  return (
    <Routes>
      <Route element={<Guest />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
      </Route>
      <Route element={<Private />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
      </Route>
      <Route path="*" element={<div className="center"><h2>Page not found</h2><a href="/">Back to dashboard</a></div>} />
    </Routes>
  );
}
