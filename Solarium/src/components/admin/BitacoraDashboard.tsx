import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../utils/api';
import type { ActividadDia, BitacoraItem, BitacoraKpis } from '../../types/api';

const PAGE_SIZE = 20;

function BarGroup({ label, insert, update, del, max }: { label: string; insert: number; update: number; del: number; max: number }) {
  const pct = (v: number) => `${Math.round((v / Math.max(1, max)) * 100)}%`;
  return (
    <div className="grid grid-cols-[90px_1fr] gap-2 items-center text-xs">
      <span className="text-slate-500 truncate">{label}</span>
      <div className="flex gap-1 h-4">
        <div className="bg-blue-400 rounded-sm" style={{ width: pct(insert) }} title={`INSERT: ${insert}`} />
        <div className="bg-amber-400 rounded-sm" style={{ width: pct(update) }} title={`UPDATE: ${update}`} />
        <div className="bg-red-400 rounded-sm"  style={{ width: pct(del) }}    title={`DELETE: ${del}`} />
      </div>
    </div>
  );
}

export default function BitacoraDashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<BitacoraKpis>({ insert: 0, update: 0, delete: 0 });
  const [reciente, setReciente] = useState<BitacoraItem[]>([]);
  const [actividad, setActividad] = useState<ActividadDia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroTabla, setFiltroTabla] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const [k, r, a] = await Promise.all([
        apiFetch<BitacoraKpis>('/api/v1/admin/bitacora/kpis', { user }),
        apiFetch<BitacoraItem[]>('/api/v1/admin/bitacora/reciente', { user }),
        apiFetch<ActividadDia[]>('/api/v1/admin/bitacora/actividad-dia?days=14', { user }),
      ]);
      setKpis(k);
      setReciente(r);
      setActividad(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar bitácora');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const tablas = useMemo(() => [...new Set(reciente.map(r => r.tabla))].sort(), [reciente]);

  const filtrado = useMemo(() => reciente.filter(r =>
    (!filtroTabla  || r.tabla === filtroTabla) &&
    (!filtroAccion || r.operacion === filtroAccion)
  ), [reciente, filtroTabla, filtroAccion]);

  const totalPages = Math.max(1, Math.ceil(filtrado.length / PAGE_SIZE));
  const pagina = filtrado.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const maxActividad = useMemo(() => Math.max(1, ...actividad.map(d => Number(d.total))), [actividad]);
  const totalHoy = kpis.insert + kpis.update + kpis.delete;

  return (
    <section className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">Dashboard de Bitácora</h2>
          <p className="text-sm text-slate-500">Actividad total hoy: {totalHoy} operaciones</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">
          Refrescar
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'INSERT', value: kpis.insert, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'UPDATE', value: kpis.update, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'DELETE', value: kpis.delete, color: 'text-red-600',  bg: 'bg-red-50'  },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-2xl border border-slate-200 p-5`}>
            <div className="text-xs text-slate-500 uppercase tracking-wide">{k.label} hoy</div>
            <div className={`text-3xl font-bold mt-1 ${k.color}`}>{loading ? '—' : k.value}</div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-3">
          <h3 className="font-semibold text-slate-800 text-sm">Actividad por día (últimos 14 días)</h3>
          <div className="flex gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block"/>INSERT</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block"/>UPDATE</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block"/>DELETE</span>
          </div>
        </div>
        <div className="grid gap-2">
          {actividad.length === 0
            ? <p className="text-sm text-slate-400">Sin datos.</p>
            : actividad.map(d => (
                <BarGroup key={d.dia} label={d.dia}
                  insert={Number((d as any).insert ?? d.total)}
                  update={Number((d as any).update ?? 0)}
                  del={Number((d as any).delete ?? 0)}
                  max={maxActividad}
                />
              ))
          }
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Tabla</span>
          <select value={filtroTabla} onChange={e => { setFiltroTabla(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Todas</option>
            {tablas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Acción</span>
          <select value={filtroAccion} onChange={e => { setFiltroAccion(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Todas</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </label>
        <span className="text-xs text-slate-400 self-end pb-2">{filtrado.length} registros</span>
      </div>

      {/* Tabla log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800 text-sm">Log reciente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500 tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Tabla</th>
                <th className="px-4 py-3 text-left">Acción</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Usuario sistema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Cargando...</td></tr>
              ) : pagina.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Sin registros.</td></tr>
              ) : pagina.map(r => (
                <tr key={r.id_bitacora} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-xs text-slate-500">{r.fecha}</td>
                  <td className="px-4 py-2 font-medium">{r.tabla}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.operacion === 'INSERT' ? 'bg-blue-100 text-blue-700' :
                      r.operacion === 'UPDATE' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{r.operacion}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-500 text-xs">{r.descripcion ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-slate-400">{(r as any).usuario_sistema ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div className="p-4 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-slate-400">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50">
              ← Anterior
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50">
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
