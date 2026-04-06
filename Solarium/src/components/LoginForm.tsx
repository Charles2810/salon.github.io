import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { LoginResponse, AuthUser } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface LoginFormProps {
  onClose?: () => void;
}

export default function LoginForm({ onClose }: LoginFormProps) {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Credenciales inválidas');
        return;
      }
      const loginData: LoginResponse = data;
      const authUser: AuthUser = {
        id_usuario: loginData.id_usuario,
        nombre: loginData.nombre,
        apellido: loginData.apellido,
        rol: loginData.rol,
        especialidad: loginData.especialidad,
        token: loginData.token,
      };
      login(authUser);
      onClose?.();
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-[420px] max-w-[95vw] bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Header dorado */}
      <div className="px-8 py-6 text-center" style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96d)' }}>
        <p className="text-white/80 text-xs uppercase tracking-widest mb-1">Bienvenido a</p>
        <h2
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          ✨ SOLARIUM
        </h2>
        <p className="text-white/70 text-sm mt-1">Inicia sesión para continuar</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="px-8 py-7 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="usuario" className="text-sm font-medium text-slate-600 uppercase tracking-wide">
            Usuario
          </label>
          <input
            id="usuario"
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
            autoComplete="username"
            placeholder="Tu nombre de usuario"
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ '--tw-ring-color': '#c9a84c' } as React.CSSProperties}
            onFocus={e => e.target.style.boxShadow = '0 0 0 2px #c9a84c'}
            onBlur={e => e.target.style.boxShadow = ''}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-600 uppercase tracking-wide">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
            onFocus={e => e.target.style.boxShadow = '0 0 0 2px #c9a84c'}
            onBlur={e => e.target.style.boxShadow = ''}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:opacity-90 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none shadow-md"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96d)' }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-slate-600 text-center transition-colors"
          >
            Cancelar
          </button>
        )}
      </form>
    </div>
  );
}
