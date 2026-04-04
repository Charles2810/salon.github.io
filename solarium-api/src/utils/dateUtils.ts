export function combinarFechaHora(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00`);
}
