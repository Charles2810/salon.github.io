import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Servicio, ReservaCreada } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface FormData {
  id_servicio: number | '';
  fecha_reserva: string;
  hora_reserva: string;
  observacion: string;
}

const INITIAL: FormData = {
  id_servicio: '',
  fecha_reserva: '',
  hora_reserva: '',
  observacion: '',
};

export default function VistaReserva() {
  const { user, logout } = useAuth();

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(true);

  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [exito, setExito] = useState<ReservaCreada | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/servicios`)
      .then(res => res.json())
      .then((data: Servicio[]) => setServicios(data))
      .catch(() => setServicios([]))
      .finally(() => setLoadingServicios(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError(null);
    setExito(null);

    try {
      const body = {
        id_servicio: Number(form.id_servicio),
        fecha_reserva: form.fecha_reserva,
        hora_reserva: form.hora_reserva,
        observacion: form.observacion.trim() || null,
      };

      const res = await fetch(`${API_URL}/api/v1/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || 'Error al agendar la reserva');
      } else {
        setExito(data as ReservaCreada);
        setForm(INITIAL);
      }
    } catch {
      setApiError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all bg-white';

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1
          className="text-2xl font-bold text-amber-700"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Solarium
        </h1>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-slate-600">
              Hola, <strong>{user.nombre}</strong>
            </span>
          )}
          <button
            onClick={logout}
            className="text-sm px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <p className="text-sm uppercase tracking-widest text-amber-600 mb-2">
              Tu cita
            </p>
            <h2
              className="text-4xl font-bold text-slate-800"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Nueva Reserva
            </h2>
          </div>

          {/* Confirmación */}
          {exito && (
            <div className="mb-6 p-4 rounded-xl text-center border bg-green-50 border-green-300 text-green-800">
              ✅ {exito.mensaje} — Reserva #{exito.id_trabajo}
            </div>
          )}

          {/* Error */}
          {apiError && (
            <div className="mb-6 p-4 rounded-xl text-center border bg-red-50 border-red-300 text-red-800">
              ⚠️ {apiError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 space-y-5"
          >
            {/* Selector de servicio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Servicio
              </label>
              {loadingServicios ? (
                <div className="animate-pulse h-12 bg-slate-200 rounded-lg" />
              ) : (
                <select
                  name="id_servicio"
                  value={form.id_servicio}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Selecciona un servicio</option>
                  {servicios.map(s => (
                    <option key={s.id_servicio} value={s.id_servicio}>
                      {s.nombre} — Bs. {Number(s.precio).toFixed(2)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                name="fecha_reserva"
                value={form.fecha_reserva}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Hora */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hora
              </label>
              <input
                type="time"
                name="hora_reserva"
                value={form.hora_reserva}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Observación */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Observación{' '}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                name="observacion"
                value={form.observacion}
                onChange={handleChange}
                rows={3}
                placeholder="Alguna indicación especial..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || loadingServicios}
              className="w-full font-bold py-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-white bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? 'Agendando...' : 'Agendar Reserva'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
