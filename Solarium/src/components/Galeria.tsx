const items = [
  { id: 1, title: 'Balayage Clásico', icon: '✨' },
  { id: 2, title: 'Corte Moderno', icon: '✂️' },
  { id: 3, title: 'Tratamiento Capilar', icon: '💆' },
  { id: 4, title: 'Diseño de Uñas', icon: '💎' },
  { id: 5, title: 'Alisado Premium', icon: '🌟' },
  { id: 6, title: 'Transformación Total', icon: '💄' },
];

export default function Galeria() {
  return (
    <section id="galeria" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-dorado)' }}>
            Nuestros trabajos
          </p>
          <h3
            className="text-5xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-negro)' }}
          >
            Galería
          </h3>
          <p className="text-xl" style={{ color: 'var(--color-gris-suave)' }}>
            Inspírate con nuestros mejores trabajos
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map(item => (
            <div
              key={item.id}
              className="group relative h-64 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--color-champagne), #e8d5a3)' }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-7xl group-hover:scale-125 transition-transform duration-300">
                {item.icon}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-end">
                <p className="text-white font-semibold text-lg mb-6 ml-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
