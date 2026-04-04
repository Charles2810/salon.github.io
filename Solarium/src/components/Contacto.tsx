export default function Contacto() {
  return (
    <section
      id="contacto"
      className="py-28 text-white"
      style={{ background: 'var(--color-negro)' }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-dorado)' }}>
            Encuéntranos
          </p>
          <h3
            className="text-5xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Contacto
          </h3>
          <p className="text-xl text-slate-300">Estamos aquí para ayudarte</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '📍', title: 'Ubicación', lines: ['Calle Principal 123', 'Ciudad, Provincia 12345'] },
            { icon: '📞', title: 'Teléfono', lines: ['+1 (555) 123-4567', '+1 (555) 987-6543'] },
            { icon: '⏰', title: 'Horario', lines: ['Lunes - Viernes: 9:00 - 19:00', 'Sábado: 10:00 - 18:00'] },
          ].map(card => (
            <div
              key={card.title}
              className="p-8 rounded-2xl border text-center group hover:border-amber-400 transition-all duration-300"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{card.icon}</div>
              <h4
                className="text-2xl font-bold mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {card.title}
              </h4>
              {card.lines.map((line, i) => (
                <p key={i} className="text-slate-300">{line}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
