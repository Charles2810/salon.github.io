import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../ui/Modal';
import Pagination from '../ui/Pagination';
import { apiFetch } from '../../utils/api';
import type { ClienteAdmin, PagedResponse } from '../../types/api';

type FormState = {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
};

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ClientesCRUD() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [data, setData] = useState<ClienteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClienteAdmin | null>(null);
  const [form, setForm] = useState<FormState>({ nombre: '', apellido: '', telefono: '', correo: '' });

  const [historialOpen, setHistorialOpen] = useState(false);
  const [historial, setHistorial] = useState<any | null>(null);

  const title = useMemo(() => (editing ? 'Editar cliente' : 'Nuevo cliente'), [editing]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(q.trim() ? { q: q.trim() } : {}),
      });
      const res = await apiFetch<PagedResponse<ClienteAdmin>>(`/api/v1/admin/clientes?${params.toString()}`, { user });
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function search() {
    setPage(1);
    load();
  }

  function openNew() {
    setEditing(null);
    setForm({ nombre: '', apellido: '', telefono: '', correo: '' });
    setSuccess(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(row: ClienteAdmin) {
    setEditing(row);
    setForm({
      nombre: row.nombre,
      apellido: row.apellido,
      telefono: row.telefono ?? '',
      correo: row.correo ?? '',
    });
    setSuccess(null);
    setError(null);
    setOpen(true);
  }

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido son requeridos.');
      return;
    }
    if (!isValidEmail(form.correo.trim())) {
      setError('Formato de correo inválido.');
      return;
    }

    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
      };

      if (editing) {
        await apiFetch(`/api/v1/admin/clientes/${editing.id_cliente}`, {
          method: 'PUT',
          user,
          body: JSON.stringify(payload),
        });
        setSuccess('Cliente actualizado.');
      } else {
        await apiFetch(`/api/v1/admin/clientes`, {
          method: 'POST',
          user,
          body: JSON.stringify(payload),
        });
        setSuccess('Cliente creado.');
      }

      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    }
  }

  async function eliminar(row: ClienteAdmin) {
    if (!confirm(`¿Eliminar/Desactivar al cliente "${row.nombre} ${row.apellido}"?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/v1/admin/clientes/${row.id_cliente}`, { method: 'DELETE', user });
      setSuccess('Cliente eliminado/desactivado.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  }

  async function verHistorial(row: ClienteAdmin) {
    setError(null);
    setHistorial(null);
    setHistorialOpen(true);
    try {
      const h = await apiFetch(`/api/v1/admin/clientes/${row.id_cliente}/historial`, { user });
      setHistorial(h);
    } catch (e) {
      setHistorial({ error: e instanceof Error ? e.message : 'Error al cargar historial' });
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">Clientes</h2>
          <p className="text-sm text-slate-500">Búsqueda por nombre y vista de historial.</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
        >
          Nuevo
        </button>
      </div>

      <div className="p-5 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o apellido..."
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm w-72"
        />
        <button
          onClick={search}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"
        >
          Buscar
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
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Correo</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    Sin clientes.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id_cliente} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      {row.nombre} {row.apellido}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.telefono ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{row.correo ?? '—'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                        onClick={() => verHistorial(row)}
                      >
                        Historial
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                        onClick={() => openEdit(row)}
                      >
                        Editar
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                        onClick={() => eliminar(row)}
                      >
                        Eliminar
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

      <Modal open={open} title={title} onClose={() => setOpen(false)}>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Nombre *</span>
              <input
                value={form.nombre}
                onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Apellido *</span>
              <input
                value={form.apellido}
                onChange={(e) => setForm((s) => ({ ...s, apellido: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Teléfono</span>
              <input
                value={form.telefono}
                onChange={(e) => setForm((s) => ({ ...s, telefono: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Correo</span>
              <input
                value={form.correo}
                onChange={(e) => setForm((s) => ({ ...s, correo: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
                inputMode="email"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
              onClick={submit}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={historialOpen} title="Historial del cliente" onClose={() => setHistorialOpen(false)}>
        {!historial ? (
          <div className="text-sm text-slate-500">Cargando...</div>
        ) : historial.error ? (
          <div className="text-sm text-red-700">{historial.error}</div>
        ) : (
          <div className="grid gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Reservas</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-500 tracking-wide">
                    <tr>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Hora</th>
                      <th className="px-3 py-2 text-left">Servicio</th>
                      <th className="px-3 py-2 text-left">Usuario</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(historial.reservas ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                          Sin reservas.
                        </td>
                      </tr>
                    ) : (
                      historial.reservas.map((r: any) => (
                        <tr key={r.id_reserva}>
                          <td className="px-3 py-2">{r.fecha_reserva}</td>
                          <td className="px-3 py-2">{r.hora_reserva}</td>
                          <td className="px-3 py-2">{r.servicio}</td>
                          <td className="px-3 py-2">{r.usuario}</td>
                          <td className="px-3 py-2">{r.estado}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Trabajos</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-500 tracking-wide">
                    <tr>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Servicio</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                      <th className="px-3 py-2 text-left">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(historial.trabajos ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                          Sin trabajos.
                        </td>
                      </tr>
                    ) : (
                      historial.trabajos.map((t: any) => (
                        <tr key={t.id_trabajo}>
                          <td className="px-3 py-2">{t.fecha}</td>
                          <td className="px-3 py-2">{t.servicio}</td>
                          <td className="px-3 py-2">{t.estado_trabajo}</td>
                          <td className="px-3 py-2">{t.notas ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

