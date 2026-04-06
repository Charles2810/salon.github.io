export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Servicio {
  id_servicio: number;
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  duracion_min: number;
  precio: number;
  categoria: string;
}

export interface Empleado {
  id_empleado: number;
  nombre: string;
  apellido: string;
  especialidad: string | null;
}

export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
}

export interface Reserva {
  id_trabajo: number;
  cliente: string;
  empleado: string;
  servicio: string;
  fecha_reserva: string;
  estado: EstadoReserva;
  precio_cobrado: number | null;
}

export type EstadoReserva =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'EN_PROCESO'
  | 'COMPLETADO'
  | 'CANCELADO';

export interface ParamsCrearReserva {
  id_cliente: number;
  id_empleado: number;
  id_servicio: number;
  fecha_reserva: Date;
  observaciones?: string;
}

export interface ParamsCambiarEstado {
  id_trabajo: number;
  nuevo_estado: EstadoReserva;
}

export interface BodyCrearReserva {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  id_servicio: number;
  id_empleado: number;
  fecha_reserva: string; // YYYY-MM-DD
  hora_reserva: string;  // HH:MM
  observaciones?: string;
}

export interface ApiError {
  error: string;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface UsuarioAuth {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  password: string;          // hash bcrypt
  especialidad: string | null;
  estado: string;
  rol: string;               // nombre del rol desde JOIN con ROLES
}

export interface JwtPayload {
  id_usuario: number;
  rol: string;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  token: string;
  id_usuario: number;
  nombre: string;
  apellido: string;
  rol: string;
  especialidad: string | null;
}

export interface ReservaAdmin {
  id_reserva: number;
  cliente: string;
  servicio: string;
  empleado: string;
  fecha_reserva: string;
  hora_reserva: string;
  estado: string;
  observacion: string | null;
}
