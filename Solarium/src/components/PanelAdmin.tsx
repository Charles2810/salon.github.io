import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { ReservaAdmin } from '../types/api';
import CategoriasCRUD from './admin/CategoriasCRUD';
import ServiciosCRUD from './admin/ServiciosCRUD';
import ClientesCRUD from './admin/ClientesCRUD';
import UsuariosCRUD from './admin/UsuariosCRUD';
import ReservasCRUD from './admin/ReservasCRUD';
import BitacoraDashboard from './admin/BitacoraDashboard';
import StoredProcedures from './admin/StoredProcedures';
import ModuloReportes from './admin/ModuloReportes';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  EN_PROCESO: 'bg-purple-100 text-purple-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function PanelAdmin() {
  const { user, logout } = useAuth();
  const [reservas, setReservas] = useState<ReservaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<
    'hoy' | 'categorias' | 'servicios' | 'clientes' | 'usuarios' | 'reservas' | 'bitacora' | 'sps' | 'reportes'
  >('hoy');

  useEffect(() => {
    if (!user?.token) return;

    async function fetchReservas() {
      try {
        const res = await fetch(`${API_URL}/api/v1/admin/reservas`, {
          headers: { Authorization: `Bearer ${user!.token}` },
        });

        if (res.status === 401) {
          logout();
          return;
        }

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data: ReservaAdmin[] = await res.json();
        setReservas(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar las reservas.');
      } finally {
        setLoading(false);
      }
    }

    fetchReservas();
  }, [user, logout]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Encabezado */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            {user?.nombre} {user?.apellido}
          </h1>
          <p className="text-sm text-slate-500 capitalize">{user?.rol?.toLowerCase()}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-slate-500 hover:text-red-600 transition-colors"
        >
          Cerrar sesión
        </button>
      </header>

      {/* Contenido */}
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {(
            [
              ['hoy', 'Hoy'],
              ['categorias', 'Categorías'],
              ['servicios', 'Servicios'],
              ['clientes', 'Clientes'],
              ['usuarios', 'Usuarios'],
              ['reservas', 'Reservas/Trabajos/Pagos'],
              ...(user?.rol === 'ADMIN' ? [['bitacora', 'Bitácora'], ['sps', 'Procedimientos'], ['reportes', 'Reportes']] : []),
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                tab === k
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'hoy' ? <h2 className="text-lg font-semibold text-slate-700 mb-4">Reservas del día</h2> : null}

        {tab === 'hoy' ? (
          error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              ⚠️ {error}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase text-slate-500 tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Servicio</th>
                    <th className="px-4 py-3 text-left">Empleado</th>
                    <th className="px-4 py-3 text-left">Hora</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : reservas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No hay reservas para hoy.
                      </td>
                    </tr>
                  ) : (
                    reservas.map((r) => (
                      <tr key={r.id_reserva} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{r.cliente}</td>
                        <td className="px-4 py-3">{r.servicio}</td>
                        <td className="px-4 py-3">{r.empleado}</td>
                        <td className="px-4 py-3">{r.hora_reserva}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              ESTADO_BADGE[r.estado] ?? 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {r.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 italic">{r.observacion ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {tab === 'categorias' ? <CategoriasCRUD /> : null}
        {tab === 'servicios' ? <ServiciosCRUD /> : null}
        {tab === 'clientes' ? <ClientesCRUD /> : null}
        {tab === 'usuarios' ? <UsuariosCRUD /> : null}
        {tab === 'reservas' ? <ReservasCRUD /> : null}
        {tab === 'bitacora' ? <BitacoraDashboard /> : null}
        {tab === 'sps' ? <StoredProcedures /> : null}
        {tab === 'reportes' ? <ModuloReportes /> : null}
      </main>
    </div>
  );
}
