import heroBg from '../assets/hero.png';

export default function Hero() {
  return (
    <section
      className="relative pt-40 pb-32 text-white overflow-hidden"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Destellos decorativos */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full filter blur-3xl" style={{ background: 'var(--color-dorado)' }} />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-purple-400 rounded-full filter blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
        <p className="text-sm uppercase tracking-[0.3em] mb-4 font-light" style={{ color: 'var(--color-champagne)' }}>
          Salón de Belleza Premium
        </p>
        <h2
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Tu Belleza Es<br />Nuestra Pasión
        </h2>
        <p className="text-xl md:text-2xl mb-10 font-light" style={{ color: 'var(--color-champagne)' }}>
          Descubre el lujo y la elegancia en cada servicio
        </p>
        <a
          href="#booking"
          className="inline-block font-bold px-10 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--color-dorado), #a07830)',
            color: 'var(--color-negro)',
            boxShadow: '0 8px 30px rgba(201, 168, 76, 0.4)',
          }}
        >
          Agendar Cita Ahora
        </a>
      </div>
    </section>
  );
}
