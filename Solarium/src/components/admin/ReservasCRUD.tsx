import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../ui/Modal';
import Pagination from '../ui/Pagination';
import { apiFetch } from '../../utils/api';
import type {
  ClienteAdmin,
  MetodoPago,
  PagedResponse,
  ServicioAdmin,
  UsuarioAdmin,
} from '../../types/api';

type ReservaRow = {
  id_reserva: number;
  id_cliente: number;
  cliente: string;
  id_servicio: number;
  servicio: string;
  id_usuario: number;
  usuario: string;
  fecha_reserva: string;
  hora_reserva: string;
  estado: string;
  observacion: string | null;
  id_trabajo: number | null;
  estado_trabajo: string | null;
  id_pago: number | null;
  estado_pago: string | null;
};

type ReservaForm = {
  id_cliente: number | '';
  id_servicio: number | '';
  id_usuario: number | '';
  fecha_reserva: string;
  hora_reserva: string;
  observacion: string;
};

type TrabajoForm = {
  id_reserva: number;
  estado: 'COMPLETADO' | 'INCOMPLETO' | 'ANULADO';
  notas: string;
};

type PagoForm = {
  id_trabajo: number;
  id_metodo_pago: number | '';
  monto: string;
  estado: 'PAGADO' | 'PENDIENTE' | 'ANULADO';
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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

  // Crear reserva
  const [openReserva, setOpenReserva] = useState(false);
  const [reservaForm, setReservaForm] = useState<ReservaForm>({
    id_cliente: '',
    id_servicio: '',
    id_usuario: '',
    fecha_reserva: todayISO(),
    hora_reserva: '09:00:00',
    observacion: '',
  });

  // Trabajo / Pago
  const [openTrabajo, setOpenTrabajo] = useState(false);
  const [trabajoForm, setTrabajoForm] = useState<TrabajoForm | null>(null);
  const [openPago, setOpenPago] = useState(false);
  const [pagoForm, setPagoForm] = useState<PagoForm | null>(null);

  const titleTrabajo = useMemo(() => 'Registrar trabajo', []);
  const titlePago = useMemo(() => 'Registrar pago', []);

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
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await apiFetch<PagedResponse<ReservaRow>>(`/api/v1/admin/reservas-admin?${params.toString()}`, { user });
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCombos().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function aplicarFiltroFecha() {
    setPage(1);
    load();
  }

  async function cancelar(row: ReservaRow) {
    if (!confirm(`¿Cancelar la reserva #${row.id_reserva}?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/v1/admin/reservas/${row.id_reserva}/cancelar`, { method: 'PATCH', user });
      setSuccess('Reserva cancelada.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cancelar');
    }
  }

  function openNuevaReserva() {
    setReservaForm((s) => ({
      ...s,
      fecha_reserva: fechaInicio,
    }));
    setOpenReserva(true);
  }

  async function submitReserva() {
    setError(null);
    setSuccess(null);
    if (!reservaForm.id_cliente || !reservaForm.id_servicio || !reservaForm.id_usuario) {
      setError('Cliente, servicio y usuario son requeridos.');
      return;
    }
    if (!reservaForm.fecha_reserva || !reservaForm.hora_reserva) {
      setError('Fecha y hora son requeridas.');
      return;
    }
    try {
      await apiFetch(`/api/v1/admin/reservas`, {
        method: 'POST',
        user,
        body: JSON.stringify({
          id_cliente: Number(reservaForm.id_cliente),
          id_servicio: Number(reservaForm.id_servicio),
          id_usuario: Number(reservaForm.id_usuario),
          fecha_reserva: reservaForm.fecha_reserva,
          hora_reserva: reservaForm.hora_reserva,
          observacion: reservaForm.observacion.trim() || null,
        }),
      });
      setOpenReserva(false);
      setSuccess('Reserva creada.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear reserva');
    }
  }

  function openRegistrarTrabajo(row: ReservaRow) {
    setTrabajoForm({
      id_reserva: row.id_reserva,
      estado: 'COMPLETADO',
      notas: '',
    });
    setOpenTrabajo(true);
  }

  async function submitTrabajo() {
    if (!trabajoForm) return;
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/v1/admin/trabajos`, {
        method: 'POST',
        user,
        body: JSON.stringify({
          id_reserva: trabajoForm.id_reserva,
          estado: trabajoForm.estado,
          notas: trabajoForm.notas.trim() || null,
        }),
      });
      setOpenTrabajo(false);
      setSuccess('Trabajo registrado.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar trabajo');
    }
  }

  function openRegistrarPago(row: ReservaRow) {
    if (!row.id_trabajo) {
      setError('Primero registra el trabajo para poder pagar.');
      return;
    }
    setPagoForm({
      id_trabajo: row.id_trabajo,
      id_metodo_pago: '',
      monto: '',
      estado: 'PAGADO',
    });
    setOpenPago(true);
  }

  async function submitPago() {
    if (!pagoForm) return;
    setError(null);
    setSuccess(null);
    const monto = Number(pagoForm.monto);
    if (!pagoForm.id_metodo_pago) {
      setError('Selecciona un método de pago.');
      return;
    }
    if (!Number.isFinite(monto) || !(monto > 0)) {
      setError('El monto debe ser positivo.');
      return;
    }
    try {
      await apiFetch(`/api/v1/admin/pagos`, {
        method: 'POST',
        user,
        body: JSON.stringify({
          id_trabajo: pagoForm.id_trabajo,
          id_metodo_pago: Number(pagoForm.id_metodo_pago),
          monto,
          estado: pagoForm.estado,
        }),
      });
      setOpenPago(false);
      setSuccess('Pago registrado.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar pago');
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">Reservas, trabajos y pagos</h2>
          <p className="text-sm text-slate-500">Vista por fecha + registrar trabajo y pago.</p>
        </div>
        <button
          onClick={openNuevaReserva}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
        >
          Nuevo
        </button>
      </div>

      <div className="p-5 flex flex-wrap items-end gap-3">
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Fecha inicio</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Fecha fin</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </label>
        <button
          onClick={aplicarFiltroFecha}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"
        >
          Aplicar
        </button>
      </div>

      {error ? (
        <div className="mx-5 mb-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mx-5 mb-5 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm">
          {success}
        </div>
      ) : null}

      <div className="px-5 pb-5">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500 tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Servicio</th>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Hora</th>
                <th className="px-4 py-3 text-left">Reserva</th>
                <th className="px-4 py-3 text-left">Trabajo</th>
                <th className="px-4 py-3 text-left">Pago</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                    Sin reservas en el rango.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id_reserva} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{row.cliente}</td>
                    <td className="px-4 py-3">{row.servicio}</td>
                    <td className="px-4 py-3">{row.usuario}</td>
                    <td className="px-4 py-3">{row.fecha_reserva}</td>
                    <td className="px-4 py-3">{row.hora_reserva}</td>
                    <td className="px-4 py-3">{row.estado}</td>
                    <td className="px-4 py-3">{row.estado_trabajo ?? '—'}</td>
                    <td className="px-4 py-3">{row.estado_pago ?? '—'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                        onClick={() => openRegistrarTrabajo(row)}
                      >
                        Trabajo
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                        onClick={() => openRegistrarPago(row)}
                      >
                        Pago
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                        onClick={() => cancelar(row)}
                        disabled={row.estado === 'CANCELADO'}
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
      </div>

      <Modal open={openReserva} title="Nueva reserva" onClose={() => setOpenReserva(false)}>
        <div className="grid grid-cols-1 gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Cliente *</span>
            <select
              value={reservaForm.id_cliente}
              onChange={(e) => setReservaForm((s) => ({ ...s, id_cliente: e.target.value ? Number(e.target.value) : '' }))}
              className="px-3 py-2 rounded-xl border border-slate-200"
            >
              <option value="">Selecciona...</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Servicio *</span>
            <select
              value={reservaForm.id_servicio}
              onChange={(e) => setReservaForm((s) => ({ ...s, id_servicio: e.target.value ? Number(e.target.value) : '' }))}
              className="px-3 py-2 rounded-xl border border-slate-200"
            >
              <option value="">Selecciona...</option>
              {servicios.filter((s) => s.estado === 'ACTIVO').map((s) => (
                <option key={s.id_servicio} value={s.id_servicio}>
                  {s.nombre} ({s.categoria})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Usuario *</span>
            <select
              value={reservaForm.id_usuario}
              onChange={(e) => setReservaForm((s) => ({ ...s, id_usuario: e.target.value ? Number(e.target.value) : '' }))}
              className="px-3 py-2 rounded-xl border border-slate-200"
            >
              <option value="">Selecciona...</option>
              {usuarios.filter((u) => u.estado === 'ACTIVO').map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombre} {u.apellido} — {u.rol}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Fecha *</span>
              <input
                type="date"
                value={reservaForm.fecha_reserva}
                onChange={(e) => setReservaForm((s) => ({ ...s, fecha_reserva: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Hora *</span>
              <input
                value={reservaForm.hora_reserva}
                onChange={(e) => setReservaForm((s) => ({ ...s, hora_reserva: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
                placeholder="HH:MM:SS"
              />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Observación</span>
            <textarea
              value={reservaForm.observacion}
              onChange={(e) => setReservaForm((s) => ({ ...s, observacion: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200"
              rows={3}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"
              onClick={() => setOpenReserva(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
              onClick={submitReserva}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={openTrabajo} title={titleTrabajo} onClose={() => setOpenTrabajo(false)}>
        <div className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Estado *</span>
            <select
              value={trabajoForm?.estado ?? 'COMPLETADO'}
              onChange={(e) => setTrabajoForm((s) => (s ? { ...s, estado: e.target.value as any } : s))}
              className="px-3 py-2 rounded-xl border border-slate-200"
            >
              <option value="COMPLETADO">COMPLETADO</option>
              <option value="INCOMPLETO">INCOMPLETO</option>
              <option value="ANULADO">ANULADO</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Notas</span>
            <textarea
              value={trabajoForm?.notas ?? ''}
              onChange={(e) => setTrabajoForm((s) => (s ? { ...s, notas: e.target.value } : s))}
              className="px-3 py-2 rounded-xl border border-slate-200"
              rows={3}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"
              onClick={() => setOpenTrabajo(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
              onClick={submitTrabajo}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={openPago} title={titlePago} onClose={() => setOpenPago(false)}>
        <div className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Método *</span>
            <select
              value={pagoForm?.id_metodo_pago ?? ''}
              onChange={(e) => setPagoForm((s) => (s ? { ...s, id_metodo_pago: e.target.value ? Number(e.target.value) : '' } : s))}
              className="px-3 py-2 rounded-xl border border-slate-200"
            >
              <option value="">Selecciona...</option>
              {metodos.map((m) => (
                <option key={m.id_metodo_pago} value={m.id_metodo_pago}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Monto *</span>
              <input
                value={pagoForm?.monto ?? ''}
                onChange={(e) => setPagoForm((s) => (s ? { ...s, monto: e.target.value } : s))}
                className="px-3 py-2 rounded-xl border border-slate-200"
                inputMode="decimal"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Estado</span>
              <select
                value={pagoForm?.estado ?? 'PAGADO'}
                onChange={(e) => setPagoForm((s) => (s ? { ...s, estado: e.target.value as any } : s))}
                className="px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="PAGADO">PAGADO</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="ANULADO">ANULADO</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"
              onClick={() => setOpenPago(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
              onClick={submitPago}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

