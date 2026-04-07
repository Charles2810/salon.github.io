const WHATSAPP_NUMBER = '59176682297';

const SERVICIOS_POPULARES = [
  'Corte y peinado',
  'Tinte y coloración',
  'Tratamiento capilar',
  'Manicure y pedicure',
  'Maquillaje profesional',
];

function buildWhatsAppUrl(servicio?: string) {
  const mensaje = servicio
    ? [
        `Hola, me comunico desde el sitio web de *SOLARIUM* 💛`,
        ``,
        `Me gustaría agendar una cita para el servicio de *${servicio}*.`,
        ``,
        `¿Podrían indicarme disponibilidad y precios? Muchas gracias 🙏`,
      ].join('\n')
    : [
        `Hola, me comunico desde el sitio web de *SOLARIUM* 💛`,
        ``,
        `Me gustaría obtener información sobre sus servicios y agendar una cita.`,
        ``,
        `¿Podrían ayudarme? Muchas gracias 🙏`,
      ].join('\n');

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
}

export default function FormularioReserva() {
  return (
    <section id="booking" className="py-28" style={{ background: 'var(--color-marfil)' }}>
      <div className="max-w-2xl mx-auto px-4 text-center">

        <p className="text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-dorado)' }}>
          Agenda tu visita
        </p>
        <h3
          className="text-5xl font-bold mb-4"
          style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-negro)' }}
        >
          Reserva tu Cita
        </h3>
        <p className="text-lg mb-10" style={{ color: 'var(--color-gris-suave)' }}>
          Escríbenos por WhatsApp y una de nuestras especialistas te atenderá personalmente para coordinar tu cita.
        </p>

        {/* Botón principal */}
        <a
          href={buildWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl mb-12"
          style={{ background: '#25D366', color: '#fff' }}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Agendar por WhatsApp
        </a>

        {/* Accesos rápidos por servicio */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
          <p className="text-sm uppercase tracking-widest mb-6 font-medium" style={{ color: 'var(--color-dorado)' }}>
            ¿Sabes qué servicio quieres? Escríbenos directo
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {SERVICIOS_POPULARES.map(servicio => (
              <a
                key={servicio}
                href={buildWhatsAppUrl(servicio)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  borderColor: 'var(--color-dorado)',
                  color: 'var(--color-dorado)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-dorado)';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-dorado)';
                }}
              >
                {servicio}
              </a>
            ))}
          </div>
        </div>

        <p className="mt-8 text-sm" style={{ color: 'var(--color-gris-suave)' }}>
          Horario de atención: Lunes a Sábado · 9:00 AM – 7:00 PM
        </p>

      </div>
    </section>
  );
}
