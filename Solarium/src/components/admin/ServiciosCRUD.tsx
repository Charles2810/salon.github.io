import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../ui/Modal';
import Pagination from '../ui/Pagination';
import { apiFetch } from '../../utils/api';
import type { CategoriaAdmin, PagedResponse, ServicioAdmin } from '../../types/api';

type FormState = {
  id_categoria: number | '';
  nombre: string;
  descripcion: string;
  precio: string;
  duracion_minutos: string;
  estado: 'ACTIVO' | 'INACTIVO';
};

export default function ServiciosCRUD() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);

  const [filtroCategoria, setFiltroCategoria] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [data, setData] = useState<ServicioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServicioAdmin | null>(null);
  const [form, setForm] = useState<FormState>({
    id_categoria: '',
    nombre: '',
    descripcion: '',
    precio: '',
    duracion_minutos: '',
    estado: 'ACTIVO',
  });

  const title = useMemo(() => (editing ? 'Editar servicio' : 'Nuevo servicio'), [editing]);

  async function loadCategorias() {
    // Trae todas las categorías (paginación grande).
    const res = await apiFetch<PagedResponse<CategoriaAdmin>>(`/api/v1/admin/categorias?page=1&pageSize=200`, { user });
    setCategorias(res.data);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(filtroCategoria ? { id_categoria: String(filtroCategoria) } : {}),
      });
      const res = await apiFetch<PagedResponse<ServicioAdmin>>(`/api/v1/admin/servicios?${q.toString()}`, { user });
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategorias().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filtroCategoria]);

  function openNew() {
    setEditing(null);
    setForm({
      id_categoria: filtroCategoria || '',
      nombre: '',
      descripcion: '',
      precio: '',
      duracion_minutos: '',
      estado: 'ACTIVO',
    });
    setSuccess(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(row: ServicioAdmin) {
    setEditing(row);
    setForm({
      id_categoria: row.id_categoria,
      nombre: row.nombre,
      descripcion: row.descripcion ?? '',
      precio: String(row.precio ?? ''),
      duracion_minutos: row.duracion_minutos != null ? String(row.duracion_minutos) : '',
      estado: row.estado,
    });
    setSuccess(null);
    setError(null);
    setOpen(true);
  }

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!form.id_categoria) {
      setError('La categoría es requerida.');
      return;
    }
    if (!form.nombre.trim()) {
      setError('El nombre es requerido.');
      return;
    }
    const precio = Number(form.precio);
    if (!Number.isFinite(precio) || !(precio > 0)) {
      setError('El precio debe ser positivo.');
      return;
    }
    const duracion = form.duracion_minutos.trim() ? Number(form.duracion_minutos) : null;
    if (duracion != null && (!Number.isFinite(duracion) || duracion < 0)) {
      setError('La duración debe ser 0 o un número positivo.');
      return;
    }

    try {
      const payload = {
        id_categoria: Number(form.id_categoria),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio,
        duracion_minutos: duracion,
        ...(editing ? { estado: form.estado } : {}),
      };
      if (editing) {
        await apiFetch(`/api/v1/admin/servicios/${editing.id_servicio}`, {
          method: 'PUT',
          user,
          body: JSON.stringify(payload),
        });
        setSuccess('Servicio actualizado.');
      } else {
        await apiFetch(`/api/v1/admin/servicios`, {
          method: 'POST',
          user,
          body: JSON.stringify(payload),
        });
        setSuccess('Servicio creado.');
      }
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    }
  }

  async function desactivar(row: ServicioAdmin) {
    if (!confirm(`¿Desactivar el servicio "${row.nombre}"?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/v1/admin/servicios/${row.id_servicio}`, { method: 'DELETE', user });
      setSuccess('Servicio desactivado.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al desactivar');
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">Servicios</h2>
          <p className="text-sm text-slate-500">CRUD con selector de categoría y precio positivo.</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
        >
          Nuevo
        </button>
      </div>

      <div className="p-5 flex items-center gap-3">
        <label className="text-sm text-slate-600">Categoría</label>
        <select
          value={filtroCategoria}
          onChange={(e) => {
            setPage(1);
            setFiltroCategoria(e.target.value ? Number(e.target.value) : '');
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
        >
          <option value="">Todas</option>
          {categorias
            .filter((c) => c.estado === 'ACTIVO')
            .map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre}
              </option>
            ))}
        </select>
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
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Precio</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Sin servicios.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id_servicio} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{row.nombre}</td>
                    <td className="px-4 py-3 text-slate-500">{row.categoria}</td>
                    <td className="px-4 py-3">${Number(row.precio).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.estado === 'ACTIVO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                        onClick={() => openEdit(row)}
                      >
                        Editar
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                        onClick={() => desactivar(row)}
                        disabled={row.estado !== 'ACTIVO'}
                      >
                        Desactivar
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
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Categoría *</span>
            <select
              value={form.id_categoria}
              onChange={(e) => setForm((s) => ({ ...s, id_categoria: e.target.value ? Number(e.target.value) : '' }))}
              className="px-3 py-2 rounded-xl border border-slate-200"
            >
              <option value="">Selecciona...</option>
              {categorias
                .filter((c) => c.estado === 'ACTIVO')
                .map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Nombre *</span>
            <input
              value={form.nombre}
              onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Descripción</span>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((s) => ({ ...s, descripcion: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
              rows={3}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Precio *</span>
              <input
                value={form.precio}
                onChange={(e) => setForm((s) => ({ ...s, precio: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
                inputMode="decimal"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Duración (min)</span>
              <input
                value={form.duracion_minutos}
                onChange={(e) => setForm((s) => ({ ...s, duracion_minutos: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
                inputMode="numeric"
              />
            </label>
          </div>
          {editing ? (
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Estado</span>
              <select
                value={form.estado}
                onChange={(e) => setForm((s) => ({ ...s, estado: e.target.value as any }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </label>
          ) : null}
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
    </section>
  );
}

