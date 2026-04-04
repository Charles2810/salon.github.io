import { useState } from 'react';
import { useServicios } from '../hooks/useServicios';
import { useEmpleados } from '../hooks/useEmpleados';
import type { FormularioReservaData, ReservaCreada } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const INITIAL: FormularioReservaData = {
  nombre: '', apellido: '', email: '', telefono: '',
  id_servicio: '', id_empleado: '', fecha_reserva: '', hora_reserva: '',
};

export default function FormularioReserva() {
  const { data: servicios } = useServicios();
  const { data: empleados } = useEmpleados();
  const [form, setForm] = useState<FormularioReservaData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [exito, setExito] = useState<ReservaCreada | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError(null);
    setExito(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || 'Error al agendar la cita');
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

  const inputClass = "w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white";
  const focusStyle = { '--tw-ring-color': 'var(--color-dorado)' } as React.CSSProperties;

  return (
    <section id="booking" className="py-28" style={{ background: 'var(--color-marfil)' }}>
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-dorado)' }}>
            Agenda tu visita
          </p>
          <h3
            className="text-5xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-negro)' }}
          >
            Agendar Cita
          </h3>
          <p className="text-xl" style={{ color: 'var(--color-gris-suave)' }}>
            Elige la fecha y hora que mejor te convenga
          </p>
        </div>

        {exito && (
          <div className="mb-6 p-4 rounded-xl text-center border" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
            ✅ {exito.mensaje} — Reserva #{exito.id_trabajo}
          </div>
        )}

        {apiError && (
          <div className="mb-6 p-4 rounded-xl text-center border" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
          <div className="grid md:grid-cols-2 gap-4">
            <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required className={inputClass} style={focusStyle} />
            <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} required className={inputClass} style={focusStyle} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required className={inputClass} style={focusStyle} />
            <input type="tel" name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} required className={inputClass} style={focusStyle} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <select name="id_servicio" value={form.id_servicio} onChange={handleChange} required className={inputClass} style={focusStyle}>
              <option value="">Selecciona un servicio</option>
              {servicios.map(s => (
                <option key={s.id_servicio} value={s.id_servicio}>{s.nombre} — Bs. {Number(s.precio).toFixed(2)}</option>
              ))}
            </select>
            <select name="id_empleado" value={form.id_empleado} onChange={handleChange} required className={inputClass} style={focusStyle}>
              <option value="">Selecciona un estilista</option>
              {empleados.map(e => (
                <option key={e.id_empleado} value={e.id_empleado}>{e.nombre} {e.apellido}</option>
              ))}
            </select>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input type="date" name="fecha_reserva" value={form.fecha_reserva} onChange={handleChange} required className={inputClass} style={focusStyle} />
            <input type="time" name="hora_reserva" value={form.hora_reserva} onChange={handleChange} required className={inputClass} style={focusStyle} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full font-bold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-white"
            style={{ background: submitting ? 'var(--color-gris-suave)' : 'var(--color-dorado)', color: 'var(--color-negro)' }}
          >
            {submitting ? 'Agendando...' : 'Agendar Cita'}
          </button>
        </form>
      </div>
    </section>
  );
}
