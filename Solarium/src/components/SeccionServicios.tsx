import { useEffect, useRef, useState } from 'react';
import { useServicios } from '../hooks/useServicios';
import SkeletonCard from './ui/SkeletonCard';
import MensajeError from './ui/MensajeError';

export default function SeccionServicios() {
  const { data: servicios, loading, error } = useServicios();
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
      id="servicios"
      ref={sectionRef}
      className="py-28"
      style={{ background: 'var(--color-marfil)' }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-dorado)' }}>
            Lo que ofrecemos
          </p>
          <h3
            className="text-5xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-negro)' }}
          >
            Nuestros Servicios
          </h3>
          <p className="text-xl" style={{ color: 'var(--color-gris-suave)' }}>
            Cuidado profesional para tu belleza integral
          </p>
        </div>

        <div
          className={`grid md:grid-cols-3 gap-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          {error && <MensajeError mensaje="No pudimos cargar los servicios." />}
          {!loading && !error && servicios.map(s => (
            <div
              key={s.id_servicio}
              className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-slate-100"
              style={{ transition: 'all 0.3s ease' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-dorado)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
            >
              <h4
                className="text-2xl font-bold mb-3"
                style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-negro)' }}
              >
                {s.nombre}
              </h4>
              <p className="mb-2 text-xs uppercase tracking-widest" style={{ color: 'var(--color-dorado)' }}>
                {s.categoria}
              </p>
              <p className="mb-6 leading-relaxed" style={{ color: 'var(--color-gris-suave)' }}>
                {s.descripcion}
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <p className="text-3xl font-bold" style={{ color: 'var(--color-dorado)' }}>
                  Bs. {Number(s.precio).toFixed(2)}
                </p>
                <span className="text-sm" style={{ color: 'var(--color-gris-suave)' }}>
                  {s.duracion_minutos ?? s.duracion_min} min
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
