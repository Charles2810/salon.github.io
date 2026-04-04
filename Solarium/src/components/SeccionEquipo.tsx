import { useEffect, useRef, useState } from 'react';
import { useEmpleados } from '../hooks/useEmpleados';
import SkeletonCard from './ui/SkeletonCard';
import MensajeError from './ui/MensajeError';

export default function SeccionEquipo() {
  const { data: empleados, loading, error } = useEmpleados();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="equipo"
      ref={sectionRef}
      className="py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-dorado)' }}>
            Conoce a nuestros expertos
          </p>
          <h3
            className="text-5xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-negro)' }}
          >
            Nuestro Equipo
          </h3>
          <p className="text-xl" style={{ color: 'var(--color-gris-suave)' }}>
            Profesionales apasionados por tu belleza
          </p>
        </div>

        <div
          className={`grid md:grid-cols-3 gap-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          {error && <MensajeError mensaje="No pudimos cargar el equipo." />}
          {!loading && !error && empleados.map(e => (
            <div
              key={e.id_empleado}
              className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 text-center border border-slate-100"
            >
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, var(--color-dorado), #a07830)' }}
              >
                {e.nombre.charAt(0)}{e.apellido.charAt(0)}
              </div>
              <h4
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-negro)' }}
              >
                {e.nombre} {e.apellido}
              </h4>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-dorado)' }}>
                {e.especialidad ?? 'Estilista'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
