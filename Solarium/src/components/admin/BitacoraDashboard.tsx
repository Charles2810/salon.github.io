import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../utils/api';
import type { ActividadDia, BitacoraItem, BitacoraKpis } from '../../types/api';

function BarChart({ data }: { data: ActividadDia[] }) {
  const max = Math.max(1, ...data.map((d) => Number(d.total)));
  return (
    <div className="grid gap-2">
      {data.map((d) => (
        <div key={d.dia} className="grid grid-cols-[110px_1fr_40px] gap-3 items-center">
          <div className="text-xs text-slate-500">{d.dia}</div>
          <div className="h-3 bg-slate-100 rounded">
            <div
              className="h-3 bg-slate-900 rounded"
              style={{ width: `${(Number(d.total) / max) * 100}%` }}
              aria-label={`Actividad ${d.dia}: ${d.total}`}
            />
          </div>
          <div className="text-xs text-slate-600 text-right">{d.total}</div>
        </div>
      ))}
    </div>
  );
}

export default function BitacoraDashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<BitacoraKpis>({ insert: 0, update: 0, delete: 0 });
  const [reciente, setReciente] = useState<BitacoraItem[]>([]);
  const [actividad, setActividad] = useState<ActividadDia[]>([]);
  const [error, setError] = useState<string | null>(null);

  const totalHoy = useMemo(() => kpis.insert + kpis.update + kpis.delete, [kpis]);

  async function load() {
    setError(null);
    try {
      const [k, r, a] = await Promise.all([
        apiFetch<BitacoraKpis>(`/api/v1/admin/bitacora/kpis`, { user }),
        apiFetch<BitacoraItem[]>(`/api/v1/admin/bitacora/reciente`, { user }),
        apiFetch<ActividadDia[]>(`/api/v1/admin/bitacora/actividad-dia?days=14`, { user }),
      ]);
      setKpis(k);
      setReciente(r);
      setActividad(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar bitácora');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">Dashboard de bitácora</h2>
          <p className="text-sm text-slate-500">
            Actividad de operaciones (INSERT/UPDATE/DELETE). Total hoy: {totalHoy}
          </p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"
        >
          Refrescar
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="text-xs text-slate-500">INSERT</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{kpis.insert}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="text-xs text-slate-500">UPDATE</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{kpis.update}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="text-xs text-slate-500">DELETE</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{kpis.delete}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Actividad por día</h3>
        {actividad.length === 0 ? (
          <div className="text-sm text-slate-400">Sin datos.</div>
        ) : (
          <BarChart data={actividad} />
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Log reciente (últimas 50)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500 tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Operación</th>
                <th className="px-4 py-3 text-left">Tabla</th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reciente.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Sin operaciones registradas.
                  </td>
                </tr>
              ) : (
                reciente.map((r) => (
                  <tr key={r.id_bitacora} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{r.fecha}</td>
                    <td className="px-4 py-3 font-medium">{r.operacion}</td>
                    <td className="px-4 py-3">{r.tabla}</td>
                    <td className="px-4 py-3">{r.id_registro ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{r.descripcion ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

