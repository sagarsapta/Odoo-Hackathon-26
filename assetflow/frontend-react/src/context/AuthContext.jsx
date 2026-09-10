import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const token = localStorage.getItem('token');

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    signIn: (data) => { localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); setUser(data.user); },
    signOut: () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); },
    updateUser: (nextUser) => { localStorage.setItem('user', JSON.stringify(nextUser)); setUser(nextUser); }
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
