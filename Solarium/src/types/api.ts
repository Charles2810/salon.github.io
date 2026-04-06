export type Servicio = {
  id_servicio: number;
  nombre: string;
  descripcion: string | null;
  duracion_min: number;
  duracion_minutos: number;
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

export type AuthUser = {
  id_usuario: number;
  nombre: string;
  apellido: string;
  rol: string;
  especialidad: string | null;
  token: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
};

export type LoginResponse = {
  token: string;
  id_usuario: number;
  nombre: string;
  apellido: string;
  rol: string;
  especialidad: string | null;
};

export type ReservaAdmin = {
  id_reserva: number;
  cliente: string;
  servicio: string;
  empleado: string;
  fecha_reserva: string;
  hora_reserva: string;
  estado: string;
  observacion: string | null;
};
