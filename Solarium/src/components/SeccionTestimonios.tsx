const testimonios = [
  { name: 'María García', comment: 'Excelente atención y resultados increíbles en mi cabello', rating: 5, initial: 'MG' },
  { name: 'Juan Pérez', comment: 'El mejor lugar para cuidarse. Muy profesionales', rating: 5, initial: 'JP' },
  { name: 'Sandra López', comment: 'Me encanta venir aquí. Siempre salgo lista', rating: 5, initial: 'SL' },
  { name: 'Diego Morales', comment: 'Servicio puntual y de excelente calidad', rating: 5, initial: 'DM' },
];

export default function SeccionTestimonios() {
  return (
    <section id="testimonios" className="py-28" style={{ background: 'var(--color-marfil)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-dorado)' }}>
            Opiniones reales
          </p>
          <h3
            className="text-5xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-negro)' }}
          >
            Lo que dicen nuestros clientes
          </h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonios.map((t, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-100"
            >
              <div className="flex items-center mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3"
                  style={{ background: 'linear-gradient(135deg, var(--color-dorado), #a07830)' }}
                >
                  {t.initial}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-negro)' }}>{t.name}</p>
                  <div className="flex">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <span key={j} className="text-lg" style={{ color: 'var(--color-dorado)' }}>★</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="italic text-sm leading-relaxed" style={{ color: 'var(--color-gris-suave)' }}>
                "{t.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
