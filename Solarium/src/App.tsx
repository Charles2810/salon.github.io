import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import PanelAdmin from './components/PanelAdmin'
import VistaReserva from './components/VistaReserva'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SeccionServicios from './components/SeccionServicios'
import Galeria from './components/Galeria'
import SeccionEquipo from './components/SeccionEquipo'
import SeccionTestimonios from './components/SeccionTestimonios'
import FormularioReserva from './components/FormularioReserva'
import Contacto from './components/Contacto'
import BotonReservaFijo from './components/BotonReservaFijo'

const ROLES_ADMIN = ['ADMIN', 'ESTILISTA', 'MANICURISTA', 'RECEPCIONISTA', 'EMPLEADO']

function AppContent() {
  const { user } = useAuth()
  const [viendoSitio, setViendoSitio] = useState(false)

  const esAdmin = user && ROLES_ADMIN.includes(user.rol)

  if (esAdmin && !viendoSitio) {
    return <PanelAdmin onVerSitio={() => setViendoSitio(true)} />
  }

  if (user && !esAdmin) {
    return <VistaReserva />
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar onVolverPanel={esAdmin && viendoSitio ? () => setViendoSitio(false) : undefined} />
      <Hero />
      <SeccionServicios />
      <Galeria />
      <SeccionEquipo />
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
