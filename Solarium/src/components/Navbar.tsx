import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoginForm from './LoginForm';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
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
            <li className="ml-2 flex items-center">
              {user ? (
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors duration-300 text-sm font-medium"
                >
                  Cerrar sesión
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors duration-300 text-sm font-medium"
                >
                  Iniciar sesión
                </button>
              )}
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
            <div className="px-4 pt-2">
              {user ? (
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full text-left px-0 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cerrar sesión
                </button>
              ) : (
                <button
                  onClick={() => { setShowLogin(true); setMenuOpen(false); }}
                  className="w-full text-left px-0 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </nav>

      {/* Login Modal — fuera de la nav para no quedar cortado */}
      {showLogin && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}
        >
          <LoginForm onClose={() => setShowLogin(false)} />
        </div>
      )}
    </>
  );
}
