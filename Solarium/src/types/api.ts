export type Servicio = {
  id_servicio: number;
  nombre: string;
  descripcion: string | null;
  duracion_min: number;
  precio: number;
  categoria: string;
};

export type Empleado = {
  id_empleado: number;
  nombre: string;
  apellido: string;
  especialidad: string | null;
};

export type FormularioReservaData = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  id_servicio: number | '';
  id_empleado: number | '';
  fecha_reserva: string;
  hora_reserva: string;
};

export type EstadoReserva =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'EN_PROCESO'
  | 'COMPLETADO'
  | 'CANCELADO';

export type ReservaCreada = {
  id_trabajo: number;
  mensaje: string;
};
