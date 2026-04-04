import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SeccionServicios from './components/SeccionServicios'
import Galeria from './components/Galeria'
import SeccionEquipo from './components/SeccionEquipo'
import SeccionTestimonios from './components/SeccionTestimonios'
import FormularioReserva from './components/FormularioReserva'
import Contacto from './components/Contacto'
import BotonReservaFijo from './components/BotonReservaFijo'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <SeccionServicios />
      <Galeria />
      <SeccionEquipo />
      <SeccionTestimonios />
      <FormularioReserva />
      <Contacto />
      <footer
        className="py-8 text-center border-t text-slate-400 text-sm"
        style={{ background: '#0a0a0a', borderColor: '#1f1f1f' }}
      >
        &copy; 2026 SOLARIUM — Salón de Belleza Premium. Todos los derechos reservados.
      </footer>
      <BotonReservaFijo />
    </div>
  )
}

export default App
