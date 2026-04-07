import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../utils/api';

type Tab = 'reservas' | 'usuarios' | 'pagos' | 'servicios';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function ReporteBlock({ texto, loading, error }: { texto: string; loading: boolean; error: string | null }) {
  if (loading) return (
    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
      Generando reporte...
    </div>
  );
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>
  );
  if (!texto) return (
    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
      Configura los filtros y presiona "Generar Reporte".
    </div>
  );
  return (
    <pre className="bg-slate-900 text-green-300 font-mono text-xs p-5 rounded-xl overflow-x-auto whitespace-pre leading-relaxed">
      {texto}
    </pre>
  );
}

function exportarTxt(texto: string, nombre: string) {
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombre}_${todayISO()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ModuloReportes() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('reservas');

  // Reservas
  const [rFechaInicio, setRFechaInicio] = useState(todayISO());
  const [rFechaFin,    setRFechaFin]    = useState(todayISO());
  const [rTexto,       setRTexto]       = useState('');
  const [rLoading,     setRLoading]     = useState(false);
  const [rError,       setRError]       = useState<string | null>(null);

  // Usuarios
  const [uIdRol,   setUIdRol]   = useState(0);
  const [uRoles,   setURoles]   = useState<{ id_rol: number; nombre: string }[]>([]);
  const [uTexto,   setUTexto]   = useState('');
  const [uLoading, setULoading] = useState(false);
  const [uError,   setUError]   = useState<string | null>(null);

  // Pagos
  const [pFechaInicio, setPFechaInicio] = useState(todayISO());
  const [pFechaFin,    setPFechaFin]    = useState(todayISO());
  const [pTexto,       setPTexto]       = useState('');
  const [pLoading,     setPLoading]     = useState(false);
  const [pError,       setPError]       = useState<string | null>(null);

  // Servicios
  const [sCatId,       setSCatId]       = useState(0);
  const [sCategorias,  setSCategorias]  = useState<{ id_categoria: number; nombre: string }[]>([]);
  const [sTexto,       setSTexto]       = useState('');
  const [sLoading,     setSLoading]     = useState(false);
  const [sError,       setSError]       = useState<string | null>(null);

  // Cargar combos
  useEffect(() => {
    apiFetch<{ data: { id_rol: number; nombre: string }[] }>('/api/v1/admin/usuarios?page=1&pageSize=1', { user })
      .catch(() => null);
    // Roles — deduplicar por id_rol
    apiFetch<{ id_rol: number; nombre: string }[]>('/api/v1/admin/roles', { user })
      .then(r => {
        const unicos = r.filter((rol, i, arr) =>
          arr.findIndex(x => x.id_rol === rol.id_rol) === i
        );
        setURoles(unicos);
      }).catch(() => {});
    // Categorías — deduplicar por id_categoria
    apiFetch<{ data: { id_categoria: number; nombre: string }[] }>('/api/v1/admin/categorias?page=1&pageSize=100', { user })
      .then(r => {
        const unicas = r.data.filter((c, i, arr) =>
          arr.findIndex(x => x.id_categoria === c.id_categoria) === i
        );
        setSCategorias(unicas);
      }).catch(() => {});
  }, []); // eslint-disable-line

  async function generarReservas() {
    setRLoading(true); setRError(null); setRTexto('');
    try {
      const r = await apiFetch<{ reporte: string }>(
        `/api/v1/admin/reportes/reservas?fecha_inicio=${rFechaInicio}&fecha_fin=${rFechaFin}`, { user });
      setRTexto(r.reporte);
    } catch (e) { setRError(e instanceof Error ? e.message : 'Error'); }
    finally { setRLoading(false); }
  }

  async function generarUsuarios() {
    setULoading(true); setUError(null); setUTexto('');
    try {
      const r = await apiFetch<{ reporte: string }>(
        `/api/v1/admin/reportes/usuarios?id_rol=${uIdRol}`, { user });
      setUTexto(r.reporte);
    } catch (e) { setUError(e instanceof Error ? e.message : 'Error'); }
    finally { setULoading(false); }
  }

  async function generarPagos() {
    setPLoading(true); setPError(null); setPTexto('');
    try {
      const r = await apiFetch<{ reporte: string }>(
        `/api/v1/admin/reportes/pagos?fecha_inicio=${pFechaInicio}&fecha_fin=${pFechaFin}`, { user });
      setPTexto(r.reporte);
    } catch (e) { setPError(e instanceof Error ? e.message : 'Error'); }
    finally { setPLoading(false); }
  }

  async function generarServicios() {
    setSLoading(true); setSError(null); setSTexto('');
    try {
      const r = await apiFetch<{ reporte: string }>(
        `/api/v1/admin/reportes/servicios?id_categoria=${sCatId}`, { user });
      setSTexto(r.reporte);
    } catch (e) { setSError(e instanceof Error ? e.message : 'Error'); }
    finally { setSLoading(false); }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'reservas',  label: 'Reservas'  },
    { key: 'usuarios',  label: 'Usuarios'  },
    { key: 'pagos',     label: 'Pagos'     },
    { key: 'servicios', label: 'Servicios' },
  ];

  const inputCls = 'px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300';
  const btnGen   = 'px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800 transition-colors';
  const btnExp   = 'px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50 transition-colors';

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-200">
        <h2 className="font-semibold text-slate-800">Reportes</h2>
        <p className="text-sm text-slate-500">Salida de stored procedures en formato texto</p>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 px-5 pt-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
              tab === t.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 grid gap-4">

        {/* RESERVAS */}
        {tab === 'reservas' && (
          <>
            <div className="flex flex-wrap gap-3 items-end">
              <label className="grid gap-1">
                <span className="text-xs text-slate-500">Fecha inicio</span>
                <input type="date" value={rFechaInicio} onChange={e => setRFechaInicio(e.target.value)} className={inputCls} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-slate-500">Fecha fin</span>
                <input type="date" value={rFechaFin} onChange={e => setRFechaFin(e.target.value)} className={inputCls} />
              </label>
              <button onClick={generarReservas} disabled={rLoading} className={btnGen}>
                {rLoading ? 'Generando...' : 'Generar Reporte'}
              </button>
              {rTexto && <button onClick={() => exportarTxt(rTexto, 'reporte_reservas')} className={btnExp}>⬇ Exportar .txt</button>}
            </div>
            <ReporteBlock texto={rTexto} loading={rLoading} error={rError} />
          </>
        )}

        {/* USUARIOS */}
        {tab === 'usuarios' && (
          <>
            <div className="flex flex-wrap gap-3 items-end">
              <label className="grid gap-1">
                <span className="text-xs text-slate-500">Rol</span>
                <select value={uIdRol} onChange={e => setUIdRol(Number(e.target.value))} className={inputCls}>
                  <option value={0}>Todos los roles</option>
                  {uRoles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
                </select>
              </label>
              <button onClick={generarUsuarios} disabled={uLoading} className={btnGen}>
                {uLoading ? 'Generando...' : 'Generar Reporte'}
              </button>
              {uTexto && <button onClick={() => exportarTxt(uTexto, 'reporte_usuarios')} className={btnExp}>⬇ Exportar .txt</button>}
            </div>
            <ReporteBlock texto={uTexto} loading={uLoading} error={uError} />
          </>
        )}

        {/* PAGOS */}
        {tab === 'pagos' && (
          <>
            <div className="flex flex-wrap gap-3 items-end">
              <label className="grid gap-1">
                <span className="text-xs text-slate-500">Fecha inicio</span>
                <input type="date" value={pFechaInicio} onChange={e => setPFechaInicio(e.target.value)} className={inputCls} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-slate-500">Fecha fin</span>
                <input type="date" value={pFechaFin} onChange={e => setPFechaFin(e.target.value)} className={inputCls} />
              </label>
              <button onClick={generarPagos} disabled={pLoading} className={btnGen}>
                {pLoading ? 'Generando...' : 'Generar Reporte'}
              </button>
              {pTexto && <button onClick={() => exportarTxt(pTexto, 'reporte_pagos')} className={btnExp}>⬇ Exportar .txt</button>}
            </div>
            <ReporteBlock texto={pTexto} loading={pLoading} error={pError} />
          </>
        )}

        {/* SERVICIOS */}
        {tab === 'servicios' && (
          <>
            <div className="flex flex-wrap gap-3 items-end">
              <label className="grid gap-1">
                <span className="text-xs text-slate-500">Categoría</span>
                <select value={sCatId} onChange={e => setSCatId(Number(e.target.value))} className={inputCls}>
                  <option value={0}>Todas las categorías</option>
                  {sCategorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                </select>
              </label>
              <button onClick={generarServicios} disabled={sLoading} className={btnGen}>
                {sLoading ? 'Generando...' : 'Generar Reporte'}
              </button>
              {sTexto && <button onClick={() => exportarTxt(sTexto, 'reporte_servicios')} className={btnExp}>⬇ Exportar .txt</button>}
            </div>
            <ReporteBlock texto={sTexto} loading={sLoading} error={sError} />
          </>
        )}

      </div>
    </section>
  );
}
