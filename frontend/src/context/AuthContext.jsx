import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
const C = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem('tripleE_token')) return setLoading(false);
    api.me().then((r) => setUser(r.user)).catch(() => { localStorage.removeItem('tripleE_token'); setUser(null); }).finally(() => setLoading(false));
  }, []);
  const login = async (email, password) => { const r = await api.login(email, password); localStorage.setItem('tripleE_token', r.token); setUser(r.user); return r; };
  const logout = () => { localStorage.removeItem('tripleE_token'); setUser(null); };
  const refresh = async () => { const r = await api.me(); setUser(r.user); return r.user; };
  return <C.Provider value={{ user, setUser, loading, login, logout, refresh }}>{children}</C.Provider>;
}
export const useAuth = () => useContext(C);
