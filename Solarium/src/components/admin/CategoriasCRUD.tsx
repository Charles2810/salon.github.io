import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../ui/Modal';
import Pagination from '../ui/Pagination';
import { apiFetch } from '../../utils/api';
import type { CategoriaAdmin, PagedResponse } from '../../types/api';

type FormState = {
  nombre: string;
  descripcion: string;
  estado: 'ACTIVO' | 'INACTIVO';
};

export default function CategoriasCRUD() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [data, setData] = useState<CategoriaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoriaAdmin | null>(null);
  const [form, setForm] = useState<FormState>({ nombre: '', descripcion: '', estado: 'ACTIVO' });

  const title = useMemo(() => (editing ? 'Editar categoría' : 'Nueva categoría'), [editing]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PagedResponse<CategoriaAdmin>>(
        `/api/v1/admin/categorias?page=${page}&pageSize=${pageSize}`,
        { user }
      );
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function openNew() {
    setEditing(null);
    setForm({ nombre: '', descripcion: '', estado: 'ACTIVO' });
    setSuccess(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(row: CategoriaAdmin) {
    setEditing(row);
    setForm({
      nombre: row.nombre,
      descripcion: row.descripcion ?? '',
      estado: row.estado,
    });
    setSuccess(null);
    setError(null);
    setOpen(true);
  }

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!form.nombre.trim()) {
      setError('El nombre es requerido.');
      return;
    }

    try {
      if (editing) {
        await apiFetch(`/api/v1/admin/categorias/${editing.id_categoria}`, {
          method: 'PUT',
          user,
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            estado: form.estado,
          }),
        });
        setSuccess('Categoría actualizada.');
      } else {
        await apiFetch(`/api/v1/admin/categorias`, {
          method: 'POST',
          user,
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
          }),
        });
        setSuccess('Categoría creada.');
      }
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    }
  }

  async function desactivar(row: CategoriaAdmin) {
    if (!confirm(`¿Desactivar la categoría "${row.nombre}"?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/v1/admin/categorias/${row.id_categoria}`, { method: 'DELETE', user });
      setSuccess('Categoría desactivada.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al desactivar');
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">Categorías</h2>
          <p className="text-sm text-slate-500">CRUD con estados ACTIVO/INACTIVO.</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
        >
          Nuevo
        </button>
      </div>

      {error ? (
        <div className="m-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="m-5 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm">
          {success}
        </div>
      ) : null}

      <div className="p-5">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500 tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Estado</th>
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
                    Sin categorías.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id_categoria} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{row.nombre}</td>
                    <td className="px-4 py-3 text-slate-500">{row.descripcion ?? '—'}</td>
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

