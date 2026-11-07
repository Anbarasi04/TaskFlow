import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import './AuthPage.css';

export default function AuthPage({ mode }) {
  const isReg = mode === 'register';
  const { login, register } = useAuth();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (isReg && !f.name.trim()) return setErr('Enter your name');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email address');
    if (f.password.length < 6) return setErr('Password must be at least 6 characters');
    setBusy(true);
    try { await (isReg ? register(f) : login(f)); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="center">
      <form className="card auth" onSubmit={submit} noValidate>
        <h1>{isReg ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">{isReg ? 'Start organising work with your team.' : 'Log in to see your boards.'}</p>
        {err && <div className="error" role="alert">{err}</div>}
        {isReg && <label>Name<input value={f.name} onChange={set('name')} maxLength={50} autoFocus /></label>}
        <label>Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
        <label>Password<input type="password" value={f.password} onChange={set('password')} autoComplete={isReg ? 'new-password' : 'current-password'} /></label>
        <button className="btn primary" disabled={busy}>{busy ? 'Please wait…' : isReg ? 'Create account' : 'Log in'}</button>
        <p className="muted small">{isReg ? 'Already registered?' : 'New here?'} <Link to={isReg ? '/login' : '/register'}>{isReg ? 'Log in' : 'Create an account'}</Link></p>
      </form>
    </div>
  );
}
