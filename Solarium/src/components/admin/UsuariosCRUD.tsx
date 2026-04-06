import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../ui/Modal';
import Pagination from '../ui/Pagination';
import { apiFetch } from '../../utils/api';
import type { PagedResponse, RolAdmin, UsuarioAdmin } from '../../types/api';

type UserForm = {
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  password: string;
  especialidad: string;
  id_rol: number | '';
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function UsuariosCRUD() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RolAdmin[]>([]);

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [data, setData] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioAdmin | null>(null);
  const [form, setForm] = useState<UserForm>({
    nombre: '',
    apellido: '',
    correo: '',
    usuario: '',
    password: '',
    especialidad: '',
    id_rol: '',
  });

  const title = useMemo(() => (editing ? 'Editar usuario' : 'Nuevo usuario'), [editing]);

  async function loadRoles() {
    const res = await apiFetch<PagedResponse<RolAdmin>>(`/api/v1/admin/roles?page=1&pageSize=200`, { user });
    setRoles(res.data);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(q.trim() ? { q: q.trim() } : {}),
      });
      const res = await apiFetch<PagedResponse<UsuarioAdmin>>(`/api/v1/admin/usuarios?${params.toString()}`, { user });
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setForm({
      nombre: '',
      apellido: '',
      correo: '',
      usuario: '',
      password: '',
      especialidad: '',
      id_rol: '',
    });
    setSuccess(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(row: UsuarioAdmin) {
    setEditing(row);
    setForm({
      nombre: row.nombre,
      apellido: row.apellido,
      correo: row.correo,
      usuario: row.usuario,
      password: '',
      especialidad: row.especialidad ?? '',
      id_rol: row.id_rol,
    });
    setSuccess(null);
    setError(null);
    setOpen(true);
  }

  async function submit() {
    setError(null);
    setSuccess(null);

    if (!form.nombre.trim() || !form.apellido.trim() || !form.usuario.trim() || !form.correo.trim()) {
      setError('Nombre, apellido, usuario y correo son requeridos.');
      return;
    }
    if (!isValidEmail(form.correo.trim())) {
      setError('Formato de correo inválido.');
      return;
    }
    if (!form.id_rol) {
      setError('Selecciona un rol.');
      return;
    }
    if (!editing && !form.password) {
      setError('La contraseña es requerida al crear.');
      return;
    }

    try {
      if (editing) {
        await apiFetch(`/api/v1/admin/usuarios/${editing.id_usuario}`, {
          method: 'PUT',
          user,
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            correo: form.correo.trim(),
            usuario: form.usuario.trim(),
            especialidad: form.especialidad.trim() || null,
          }),
        });
        await apiFetch(`/api/v1/admin/usuarios/${editing.id_usuario}/rol`, {
          method: 'PATCH',
          user,
          body: JSON.stringify({ id_rol: Number(form.id_rol) }),
        });
        setSuccess('Usuario actualizado.');
      } else {
        await apiFetch(`/api/v1/admin/usuarios`, {
          method: 'POST',
          user,
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            correo: form.correo.trim(),
            usuario: form.usuario.trim(),
            password: form.password,
            especialidad: form.especialidad.trim() || null,
            id_rol: Number(form.id_rol),
          }),
        });
        setSuccess('Usuario creado.');
      }

      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    }
  }

  async function desactivar(row: UsuarioAdmin) {
    if (!confirm(`¿Desactivar al usuario "${row.usuario}"?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/v1/admin/usuarios/${row.id_usuario}`, { method: 'DELETE', user });
      setSuccess('Usuario desactivado.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al desactivar');
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">Usuarios</h2>
          <p className="text-sm text-slate-500">CRUD con selector de rol y desactivación.</p>
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
          placeholder="Buscar por nombre, usuario o correo..."
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm w-80"
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
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Correo</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Sin usuarios.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id_usuario} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{row.usuario}</td>
                    <td className="px-4 py-3">
                      {row.nombre} {row.apellido}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.correo}</td>
                    <td className="px-4 py-3">{row.rol}</td>
                    <td className="px-4 py-3">{row.estado}</td>
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
              <span className="text-sm font-medium text-slate-700">Usuario *</span>
              <input
                value={form.usuario}
                onChange={(e) => setForm((s) => ({ ...s, usuario: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Correo *</span>
              <input
                value={form.correo}
                onChange={(e) => setForm((s) => ({ ...s, correo: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
                inputMode="email"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Rol *</span>
              <select
                value={form.id_rol}
                onChange={(e) => setForm((s) => ({ ...s, id_rol: e.target.value ? Number(e.target.value) : '' }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="">Selecciona...</option>
                {roles
                  .filter((r) => r.estado === 'ACTIVO')
                  .map((r) => (
                    <option key={r.id_rol} value={r.id_rol}>
                      {r.nombre}
                    </option>
                  ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Especialidad</span>
              <input
                value={form.especialidad}
                onChange={(e) => setForm((s) => ({ ...s, especialidad: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
              />
            </label>
          </div>
          {!editing ? (
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Contraseña *</span>
              <input
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200"
                type="password"
              />
            </label>
          ) : (
            <p className="text-xs text-slate-500">
              La contraseña no se cambia aquí (puedes extenderlo si lo necesitas).
            </p>
          )}
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

