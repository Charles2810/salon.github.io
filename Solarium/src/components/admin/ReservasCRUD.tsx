import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../ui/Modal';
import Pagination from '../ui/Pagination';
import { apiFetch } from '../../utils/api';
import type { ClienteAdmin, MetodoPago, PagedResponse, ServicioAdmin, UsuarioAdmin } from '../../types/api';

type ReservaRow = {
  id_reserva: number; id_cliente: number; cliente: string;
  id_servicio: number; servicio: string; id_usuario: number; usuario: string;
  fecha_reserva: string; hora_reserva: string; estado: string; observacion: string | null;
  id_trabajo: number | null; estado_trabajo: string | null;
  id_pago: number | null; estado_pago: string | null; monto_pago: number | null;
};

type ReservaForm = {
  id_cliente: number | ''; id_servicio: number | ''; id_usuario: number | '';
  fecha_reserva: string; hora_reserva: string; observacion: string; estado: string;
};

type TrabajoForm = {
  id_reserva: number; id_trabajo: number | null;
  estado: 'COMPLETADO' | 'INCOMPLETO' | 'ANULADO';
  notas: string; precio_cobrado: string;
};

type PagoForm = {
  id_trabajo: number; id_pago: number | null;
  id_metodo_pago: number | ''; monto: string;
  estado: 'PAGADO' | 'PENDIENTE' | 'ANULADO';
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE:   'bg-yellow-100 text-yellow-800',
  CONFIRMADO:  'bg-blue-100 text-blue-800',
  EN_PROCESO:  'bg-purple-100 text-purple-800',
  COMPLETADO:  'bg-green-100 text-green-800',
  CANCELADO:   'bg-red-100 text-red-800',
  INCOMPLETO:  'bg-orange-100 text-orange-800',
  ANULADO:     'bg-slate-100 text-slate-600',
  PAGADO:      'bg-green-100 text-green-800',
};

const sel = 'px-3 py-2 rounded-xl border border-slate-200 text-sm w-full';
const inp = 'px-3 py-2 rounded-xl border border-slate-200 text-sm w-full';

export default function ReservasCRUD() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [data, setData] = useState<ReservaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState(todayISO());
  const [fechaFin, setFechaFin] = useState(todayISO());

  const [clientes, setClientes] = useState<ClienteAdmin[]>([]);
  const [servicios, setServicios] = useState<ServicioAdmin[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);

  // Modales reserva
  const [openReserva, setOpenReserva] = useState(false);
  const [editingReserva, setEditingReserva] = useState<ReservaRow | null>(null);
  const [reservaForm, setReservaForm] = useState<ReservaForm>({
    id_cliente: '', id_servicio: '', id_usuario: '',
    fecha_reserva: todayISO(), hora_reserva: '09:00', observacion: '', estado: 'PENDIENTE',
  });

  // Modales trabajo
  const [openTrabajo, setOpenTrabajo] = useState(false);
  const [trabajoForm, setTrabajoForm] = useState<TrabajoForm | null>(null);

  // Modales pago
  const [openPago, setOpenPago] = useState(false);
  const [pagoForm, setPagoForm] = useState<PagoForm | null>(null);

  async function loadCombos() {
    const [c, s, u, m] = await Promise.all([
      apiFetch<PagedResponse<ClienteAdmin>>(`/api/v1/admin/clientes?page=1&pageSize=200`, { user }),
      apiFetch<PagedResponse<ServicioAdmin>>(`/api/v1/admin/servicios?page=1&pageSize=200`, { user }),
      apiFetch<PagedResponse<UsuarioAdmin>>(`/api/v1/admin/usuarios?page=1&pageSize=200`, { user }),
      apiFetch<MetodoPago[]>(`/api/v1/admin/metodos-pago`, { user }),
    ]);
    setClientes(c.data);
    setServicios(s.data);
    setUsuarios(u.data);
    setMetodos(m);
  }

  async function load() {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, page: String(page), pageSize: String(pageSize) });
      const res = await apiFetch<PagedResponse<ReservaRow>>(`/api/v1/admin/reservas-admin?${params}`, { user });
      setData(res.data); setTotal(res.total);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadCombos().catch(() => {}); }, []); // eslint-disable-line
  useEffect(() => { load(); }, [page]); // eslint-disable-line

  // ── RESERVA ──────────────────────────────────────────────────────
  function openNueva() {
    setEditingReserva(null);
    setReservaForm({ id_cliente: '', id_servicio: '', id_usuario: '', fecha_reserva: fechaInicio, hora_reserva: '09:00', observacion: '', estado: 'PENDIENTE' });
    setOpenReserva(true);
  }

  function openEditar(row: ReservaRow) {
    setEditingReserva(row);
    setReservaForm({
      id_cliente: row.id_cliente, id_servicio: row.id_servicio, id_usuario: row.id_usuario,
      fecha_reserva: row.fecha_reserva, hora_reserva: row.hora_reserva.slice(0, 5),
      observacion: row.observacion ?? '', estado: row.estado,
    });
    setOpenReserva(true);
  }

  async function submitReserva() {
    setError(null); setSuccess(null);
    if (!reservaForm.id_cliente || !reservaForm.id_servicio || !reservaForm.id_usuario) { setError('Cliente, servicio y usuario son requeridos.'); return; }
    try {
      const body = {
        id_cliente: Number(reservaForm.id_cliente), id_servicio: Number(reservaForm.id_servicio),
        id_usuario: Number(reservaForm.id_usuario), fecha_reserva: reservaForm.fecha_reserva,
        hora_reserva: reservaForm.hora_reserva, observacion: reservaForm.observacion.trim() || null,
        estado: reservaForm.estado,
      };
      if (editingReserva) {
        await apiFetch(`/api/v1/admin/reservas/${editingReserva.id_reserva}`, { method: 'PUT', user, body: JSON.stringify(body) });
        setSuccess('Reserva actualizada.');
      } else {
        await apiFetch(`/api/v1/admin/reservas`, { method: 'POST', user, body: JSON.stringify(body) });
        setSuccess('Reserva creada.');
      }
      setOpenReserva(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }

  async function cancelar(row: ReservaRow) {
    if (!confirm(`¿Cancelar la reserva de ${row.cliente}?`)) return;
    try {
      await apiFetch(`/api/v1/admin/reservas/${row.id_reserva}/cancelar`, { method: 'PATCH', user });
      setSuccess('Reserva cancelada.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }

  // ── TRABAJO ──────────────────────────────────────────────────────
  function openTrabajoDlg(row: ReservaRow) {
    setTrabajoForm({
      id_reserva: row.id_reserva, id_trabajo: row.id_trabajo,
      estado: (row.estado_trabajo as any) ?? 'COMPLETADO',
      notas: '', precio_cobrado: '',
    });
    setOpenTrabajo(true);
  }

  async function submitTrabajo() {
    if (!trabajoForm) return;
    setError(null); setSuccess(null);
    try {
      if (trabajoForm.id_trabajo) {
        await apiFetch(`/api/v1/admin/trabajos/${trabajoForm.id_trabajo}`, {
          method: 'PUT', user,
          body: JSON.stringify({ estado: trabajoForm.estado, observacion: trabajoForm.notas || null, precio_cobrado: Number(trabajoForm.precio_cobrado) || 0 }),
        });
        setSuccess('Trabajo actualizado.');
      } else {
        await apiFetch(`/api/v1/admin/trabajos`, {
          method: 'POST', user,
          body: JSON.stringify({ id_reserva: trabajoForm.id_reserva, estado: trabajoForm.estado, notas: trabajoForm.notas || null }),
        });
        setSuccess('Trabajo registrado.');
      }
      setOpenTrabajo(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }

  // ── PAGO ─────────────────────────────────────────────────────────
  function openPagoDlg(row: ReservaRow) {
    if (!row.id_trabajo) { setError('Primero registra el trabajo.'); return; }
    setPagoForm({
      id_trabajo: row.id_trabajo, id_pago: row.id_pago,
      id_metodo_pago: '', monto: row.monto_pago ? String(row.monto_pago) : '',
      estado: (row.estado_pago as any) ?? 'PAGADO',
    });
    setOpenPago(true);
  }

  async function submitPago() {
    if (!pagoForm) return;
    setError(null); setSuccess(null);
    const monto = Number(pagoForm.monto);
    if (!pagoForm.id_metodo_pago) { setError('Selecciona un método de pago.'); return; }
    if (!Number.isFinite(monto) || monto <= 0) { setError('El monto debe ser positivo.'); return; }
    const metodo = metodos.find(m => m.id_metodo_pago === Number(pagoForm.id_metodo_pago))?.nombre ?? 'EFECTIVO';
    try {
      if (pagoForm.id_pago) {
        await apiFetch(`/api/v1/admin/pagos/${pagoForm.id_pago}`, {
          method: 'PUT', user,
          body: JSON.stringify({ monto, metodo_pago: metodo, estado: pagoForm.estado }),
        });
        setSuccess('Pago actualizado.');
      } else {
        await apiFetch(`/api/v1/admin/pagos`, {
          method: 'POST', user,
          body: JSON.stringify({ id_trabajo: pagoForm.id_trabajo, id_metodo_pago: Number(pagoForm.id_metodo_pago), monto, estado: pagoForm.estado }),
        });
        setSuccess('Pago registrado.');
      }
      setOpenPago(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">Reservas, Trabajos y Pagos</h2>
          <p className="text-sm text-slate-500">Gestión completa con edición.</p>
        </div>
        <button onClick={openNueva} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800">+ Nueva</button>
      </div>

      {/* Filtro fecha */}
      <div className="p-5 flex flex-wrap gap-3 items-end">
        <label className="grid gap-1"><span className="text-xs text-slate-500">Fecha inicio</span>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        </label>
        <label className="grid gap-1"><span className="text-xs text-slate-500">Fecha fin</span>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        </label>
        <button onClick={() => { setPage(1); load(); }} className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">Aplicar</button>
      </div>

      {error   && <div className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>}
      {success && <div className="mx-5 mb-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm">{success}</div>}

      <div className="px-5 pb-5 overflow-x-auto">
        <table className="min-w-full text-sm text-slate-700 rounded-xl border border-slate-200">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500 tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Servicio</th>
              <th className="px-4 py-3 text-left">Fecha / Hora</th>
              <th className="px-4 py-3 text-left">Reserva</th>
              <th className="px-4 py-3 text-left">Trabajo</th>
              <th className="px-4 py-3 text-left">Pago</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Cargando...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Sin reservas en el rango.</td></tr>
            ) : data.map(row => (
              <tr key={row.id_reserva} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{row.cliente}</td>
                <td className="px-4 py-3">{row.servicio}</td>
                <td className="px-4 py-3 text-xs">{row.fecha_reserva}<br/>{row.hora_reserva}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[row.estado] ?? 'bg-slate-100 text-slate-600'}`}>{row.estado}</span>
                </td>
                <td className="px-4 py-3">
                  {row.estado_trabajo
                    ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[row.estado_trabajo] ?? 'bg-slate-100 text-slate-600'}`}>{row.estado_trabajo}</span>
                    : <span className="text-slate-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  {row.estado_pago
                    ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[row.estado_pago] ?? 'bg-slate-100 text-slate-600'}`}>{row.estado_pago}</span>
                    : <span className="text-slate-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end flex-wrap">
                    <button onClick={() => openEditar(row)} className="px-2 py-1 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">Editar</button>
                    <button onClick={() => openTrabajoDlg(row)} className="px-2 py-1 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">
                      {row.id_trabajo ? 'Trabajo ✏️' : 'Trabajo'}
                    </button>
                    <button onClick={() => openPagoDlg(row)} className="px-2 py-1 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">
                      {row.id_pago ? 'Pago ✏️' : 'Pago'}
                    </button>
                    <button onClick={() => cancelar(row)} disabled={row.estado === 'CANCELADO'} className="px-2 py-1 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50 disabled:opacity-40">Cancelar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
      </div>

      {/* Modal Reserva */}
      <Modal open={openReserva} title={editingReserva ? 'Editar reserva' : 'Nueva reserva'} onClose={() => setOpenReserva(false)}>
        <div className="grid gap-4">
          <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Cliente *</span>
            <select value={reservaForm.id_cliente} onChange={e => setReservaForm(s => ({ ...s, id_cliente: e.target.value ? Number(e.target.value) : '' }))} className={sel}>
              <option value="">Selecciona...</option>
              {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido}</option>)}
            </select>
          </label>
          <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Servicio *</span>
            <select value={reservaForm.id_servicio} onChange={e => setReservaForm(s => ({ ...s, id_servicio: e.target.value ? Number(e.target.value) : '' }))} className={sel}>
              <option value="">Selecciona...</option>
              {servicios.filter(s => s.estado === 'ACTIVO').map(s => <option key={s.id_servicio} value={s.id_servicio}>{s.nombre}</option>)}
            </select>
          </label>
          <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Empleado *</span>
            <select value={reservaForm.id_usuario} onChange={e => setReservaForm(s => ({ ...s, id_usuario: e.target.value ? Number(e.target.value) : '' }))} className={sel}>
              <option value="">Selecciona...</option>
              {usuarios.filter(u => u.estado === 'ACTIVO').map(u => <option key={u.id_usuario} value={u.id_usuario}>{u.nombre} {u.apellido} — {u.rol}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Fecha *</span>
              <input type="date" value={reservaForm.fecha_reserva} onChange={e => setReservaForm(s => ({ ...s, fecha_reserva: e.target.value }))} className={inp} />
            </label>
            <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Hora *</span>
              <input type="time" value={reservaForm.hora_reserva} onChange={e => setReservaForm(s => ({ ...s, hora_reserva: e.target.value }))} className={inp} />
            </label>
          </div>
          {editingReserva && (
            <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Estado</span>
              <select value={reservaForm.estado} onChange={e => setReservaForm(s => ({ ...s, estado: e.target.value }))} className={sel}>
                {['PENDIENTE','CONFIRMADO','EN_PROCESO','COMPLETADO','CANCELADO'].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </label>
          )}
          <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Observación</span>
            <textarea value={reservaForm.observacion} onChange={e => setReservaForm(s => ({ ...s, observacion: e.target.value }))} className={inp} rows={2} />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpenReserva(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">Cancelar</button>
            <button onClick={submitReserva} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800">Guardar</button>
          </div>
        </div>
      </Modal>

      {/* Modal Trabajo */}
      <Modal open={openTrabajo} title={trabajoForm?.id_trabajo ? 'Editar trabajo' : 'Registrar trabajo'} onClose={() => setOpenTrabajo(false)}>
        <div className="grid gap-4">
          <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Estado *</span>
            <select value={trabajoForm?.estado ?? 'COMPLETADO'} onChange={e => setTrabajoForm(s => s ? { ...s, estado: e.target.value as any } : s)} className={sel}>
              <option value="COMPLETADO">COMPLETADO</option>
              <option value="INCOMPLETO">INCOMPLETO</option>
              <option value="ANULADO">ANULADO</option>
            </select>
          </label>
          {trabajoForm?.id_trabajo && (
            <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Precio cobrado</span>
              <input value={trabajoForm.precio_cobrado} onChange={e => setTrabajoForm(s => s ? { ...s, precio_cobrado: e.target.value } : s)} className={inp} inputMode="decimal" placeholder="0.00" />
            </label>
          )}
          <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Notas</span>
            <textarea value={trabajoForm?.notas ?? ''} onChange={e => setTrabajoForm(s => s ? { ...s, notas: e.target.value } : s)} className={inp} rows={2} />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpenTrabajo(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">Cancelar</button>
            <button onClick={submitTrabajo} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800">Guardar</button>
          </div>
        </div>
      </Modal>

      {/* Modal Pago */}
      <Modal open={openPago} title={pagoForm?.id_pago ? 'Editar pago' : 'Registrar pago'} onClose={() => setOpenPago(false)}>
        <div className="grid gap-4">
          <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Método *</span>
            <select value={pagoForm?.id_metodo_pago ?? ''} onChange={e => setPagoForm(s => s ? { ...s, id_metodo_pago: e.target.value ? Number(e.target.value) : '' } : s)} className={sel}>
              <option value="">Selecciona...</option>
              {metodos.map(m => <option key={m.id_metodo_pago} value={m.id_metodo_pago}>{m.nombre}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Monto *</span>
              <input value={pagoForm?.monto ?? ''} onChange={e => setPagoForm(s => s ? { ...s, monto: e.target.value } : s)} className={inp} inputMode="decimal" />
            </label>
            <label className="grid gap-1"><span className="text-sm font-medium text-slate-700">Estado</span>
              <select value={pagoForm?.estado ?? 'PAGADO'} onChange={e => setPagoForm(s => s ? { ...s, estado: e.target.value as any } : s)} className={sel}>
                <option value="PAGADO">PAGADO</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="ANULADO">ANULADO</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpenPago(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">Cancelar</button>
            <button onClick={submitPago} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800">Guardar</button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
