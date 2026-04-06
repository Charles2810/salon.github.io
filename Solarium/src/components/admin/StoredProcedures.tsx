import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../utils/api';

type SP = {
  nombre: string;
  tipo: string;
  creado: string;
  modificado: string;
};

export default function StoredProcedures() {
  const { user } = useAuth();
  const [data, setData] = useState<SP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<SP[]>('/api/v1/admin/stored-procedures', { user })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-200">
        <h2 className="font-semibold text-slate-800">Procedimientos Almacenados</h2>
        <p className="text-sm text-slate-500">{data.length} procedimientos en DB_TiendaBelleza</p>
      </div>

      {error && (
        <div className="m-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>
      )}

      <div className="p-5">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500 tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Creado</th>
                <th className="px-4 py-3 text-left">Modificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-400">Cargando...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-400">Sin procedimientos.</td></tr>
              ) : (
                data.map((sp) => (
                  <tr key={sp.nombre} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">{sp.nombre}</td>
                    <td className="px-4 py-3 text-slate-500">{sp.creado}</td>
                    <td className="px-4 py-3 text-slate-500">{sp.modificado}</td>
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
