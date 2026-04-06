import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, AuthContextValue } from '../types/api';

export const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwtPayload(token: string): { id_usuario?: number; rol?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const payload = parts[1];
    const padded = payload + '=='.slice((payload.length % 4) || 4);
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = decodeJwtPayload(token);
    if (!payload.id_usuario || !payload.rol) return;

    const stored = localStorage.getItem('authUser');
    if (stored) {
      try {
        const parsed: AuthUser = JSON.parse(stored);
        setUser(parsed);
      } catch {
        // datos corruptos, ignorar
      }
    }
  }, []);

  function login(authUser: AuthUser) {
    setUser(authUser);
    localStorage.setItem('token', authUser.token);
    localStorage.setItem('authUser', JSON.stringify(authUser));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
