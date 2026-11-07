import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  const logout = useCallback(() => { localStorage.removeItem('token'); setUser(null); }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api('/auth/me').then((d) => setUser(d.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);
  useEffect(() => { window.addEventListener('logout', logout); return () => window.removeEventListener('logout', logout); }, [logout]);

  const authenticate = async (path, body) => { 
    const d = await api(path, { method: 'POST', body }); 
    localStorage.setItem('token', d.token); 
    setUser(d.user);
   };
  return (
    <Ctx.Provider value={{ user, loading, logout, login: (b) => authenticate('/auth/login', b), register: (b) => authenticate('/auth/register', b) }}>
      {children}
    </Ctx.Provider>
  );
}
