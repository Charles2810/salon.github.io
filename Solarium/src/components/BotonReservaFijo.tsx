export default function BotonReservaFijo() {
  return (
    <a
      href="#booking"
      className="fixed bottom-6 right-6 z-50 font-bold px-5 py-3 rounded-full transition-all duration-300 hover:scale-110 text-sm"
      style={{
        background: 'var(--color-dorado)',
        color: 'var(--color-negro)',
        boxShadow: '0 8px 30px rgba(201, 168, 76, 0.5)',
      }}
      aria-label="Agendar cita"
    >
      ✨ Reservar
    </a>
  );
}
