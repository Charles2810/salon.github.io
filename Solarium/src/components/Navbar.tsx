import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <h1 className="text-2xl font-bold tracking-widest" style={{ color: 'var(--color-dorado)', fontFamily: "'Playfair Display', serif" }}>
            ✨ SOLARIUM
          </h1>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-1 text-slate-600">
            {['Servicios', 'Galería', 'Equipo', 'Testimonios', 'Contacto'].map(item => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase().replace('í', 'i')}`}
                  className="px-4 py-2 hover:text-slate-900 transition-colors duration-300"
                >
                  {item}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#booking"
                className="ml-2 px-5 py-2 rounded-lg font-semibold text-white transition-all duration-300"
                style={{ background: 'var(--color-dorado)' }}
              >
                Reservar
              </a>
            </li>
          </ul>

          {/* Mobile Menu Button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2" aria-label="Abrir menú">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-200">
            {['servicios', 'galeria', 'equipo', 'testimonios', 'contacto', 'booking'].map(id => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 hover:bg-slate-100 rounded capitalize"
              >
                {id === 'booking' ? 'Reservar' : id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
