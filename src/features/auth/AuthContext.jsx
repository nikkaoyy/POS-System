import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

const USERS = {
  '1234': { role: 'admin', name: 'Administrador' },
  '1111': { role: 'cashier', name: 'Cajero' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = useCallback((pin) => {
    const found = USERS[pin];
    if (found) {
      setUser({ ...found, loginTime: new Date().toISOString() });
      return { success: true, user: found };
    }
    return { success: false };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isCashier = user?.role === 'cashier';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isCashier }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
