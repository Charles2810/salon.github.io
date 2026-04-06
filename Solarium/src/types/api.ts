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

export type PagedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type CategoriaAdmin = {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  estado: 'ACTIVO' | 'INACTIVO';
};

export type ServicioAdmin = {
  id_servicio: number;
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_minutos: number | null;
  categoria: string;
  estado: 'ACTIVO' | 'INACTIVO';
};

export type ClienteAdmin = {
  id_cliente: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  correo: string | null;
  estado?: string;
};

export type RolAdmin = {
  id_rol: number;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
};

export type UsuarioAdmin = {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  especialidad: string | null;
  estado: string;
  id_rol: number;
  rol: string;
};

export type MetodoPago = {
  id_metodo_pago: number;
  nombre: string;
};

export type BitacoraItem = {
  id_bitacora: number;
  operacion: 'INSERT' | 'UPDATE' | 'DELETE';
  tabla: string;
  id_registro: number | null;
  descripcion: string | null;
  actor_id_usuario: number | null;
  fecha: string;
};

export type BitacoraKpis = {
  insert: number;
  update: number;
  delete: number;
};

export type ActividadDia = {
  dia: string;
  total: number;
};
