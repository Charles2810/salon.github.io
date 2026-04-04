interface MensajeErrorProps {
  mensaje: string;
}

export default function MensajeError({ mensaje }: MensajeErrorProps) {
  return (
    <div className="col-span-full text-center py-12">
      <p className="text-slate-500 text-lg">⚠️ {mensaje}</p>
      <p className="text-slate-400 text-sm mt-2">Por favor intenta de nuevo más tarde.</p>
    </div>
  );
}
