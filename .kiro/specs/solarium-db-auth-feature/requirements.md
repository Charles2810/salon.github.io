# Documento de Requisitos — solarium-db-auth-feature

## Introducción

Esta feature conecta el proyecto Solarium a la base de datos SQL Server `DB_TiendaBelleza`, agrega autenticación de usuarios con control de acceso basado en roles, y adapta la interfaz del frontend según el tipo de usuario autenticado.

Los tres ejes principales son:

1. **Conexión a la BD `DB_TiendaBelleza`**: Reconfigurar el pool de conexiones del backend para apuntar a la nueva base de datos con su esquema real (tablas `USUARIOS`, `ROLES`, `SERVICIOS`, `RESERVAS`, etc.).
2. **Carga de servicios desde la BD**: Asegurar que el endpoint existente de servicios funcione correctamente con el esquema de `DB_TiendaBelleza`.
3. **Autenticación y control de acceso por rol**: Agregar login de usuario, generar un token de sesión, y mostrar vistas diferenciadas según el rol (panel administrativo/empleado vs. vista de reserva para clientes).

---

## Glosario

- **Sistema**: El conjunto completo formado por el Frontend y el Backend de Solarium.
- **Frontend**: La aplicación React/Vite/TypeScript que el usuario visualiza en el navegador.
- **Backend**: El servidor Node.js/Express/TypeScript que expone la API REST.
- **API**: La interfaz REST que el Backend expone.
- **BD**: La base de datos SQL Server `DB_TiendaBelleza`.
- **Pool**: El pool de conexiones `mssql` que gestiona las conexiones a la BD.
- **Usuario**: Un registro en la tabla `USUARIOS` de la BD que puede autenticarse en el sistema.
- **Cliente_BD**: Un registro en la tabla `CLIENTES` de la BD que representa a un cliente del salón (sin credenciales de acceso al sistema).
- **Rol**: Un registro en la tabla `ROLES` que define el nivel de acceso de un Usuario (`ADMIN`, `ESTILISTA`, `MANICURISTA`, `RECEPCIONISTA`, `EMPLEADO`).
- **Rol_Administrativo**: Cualquiera de los roles: `ADMIN`, `ESTILISTA`, `MANICURISTA`, `RECEPCIONISTA`, `EMPLEADO`.
- **Rol_Cliente**: El rol asignado a usuarios que solo pueden realizar reservas (no pertenece a Rol_Administrativo).
- **Token_JWT**: Un JSON Web Token firmado que el Backend emite al autenticar un Usuario y que el Frontend almacena para identificar la sesión.
- **Panel_Admin**: La vista del Frontend que muestra funcionalidades de gestión (reservas, servicios, empleados) accesible solo para Rol_Administrativo.
- **Vista_Reserva**: La vista del Frontend que muestra únicamente el formulario de reserva, accesible para Rol_Cliente.
- **Login_Form**: El componente del Frontend que permite al Usuario ingresar sus credenciales.
- **Auth_Context**: El contexto React que almacena el estado de autenticación y el rol del usuario activo.
- **Servicio**: Un registro en la tabla `SERVICIOS` de la BD que describe un tratamiento ofrecido.
- **Seccion_Servicios**: El componente del Frontend que muestra la lista de servicios disponibles.

---

## Requisitos

### Requisito 1: Conexión a la base de datos DB_TiendaBelleza

**Historia de usuario:** Como desarrollador, quiero que el backend se conecte correctamente a la base de datos `DB_TiendaBelleza` en SQL Server, para que todos los endpoints consuman datos reales del salón.

#### Criterios de aceptación

1. THE Backend SHALL leer el nombre de la base de datos desde la variable de entorno `DB_NAME`, cuyo valor por defecto será `DB_TiendaBelleza`.
2. THE Backend SHALL leer el servidor, puerto, usuario y contraseña de la BD desde las variables de entorno `DB_HOST`, `DB_PORT`, `DB_USER` y `DB_PASSWORD` respectivamente, sin incluir credenciales en el código fuente.
3. WHEN el Backend inicia y la conexión al Pool falla, THE Backend SHALL registrar el error en consola y terminar el proceso con código de salida distinto de cero.
4. WHEN el Backend inicia y la conexión al Pool es exitosa, THE Backend SHALL registrar un mensaje de confirmación en consola indicando la BD conectada.
5. THE Backend SHALL actualizar el archivo `.env.example` para reflejar las variables de entorno requeridas por `DB_TiendaBelleza`.

---

### Requisito 2: Carga de servicios desde DB_TiendaBelleza

**Historia de usuario:** Como visitante del sitio, quiero ver los servicios reales del salón cargados desde `DB_TiendaBelleza`, para tener información actualizada sobre tratamientos y precios.

#### Criterios de aceptación

1. THE API SHALL exponer el endpoint `GET /api/v1/servicios` que consulta la tabla `SERVICIOS` de `DB_TiendaBelleza` y retorna todos los registros con `ESTADO = 1`.
2. WHEN se llama a `GET /api/v1/servicios`, THE API SHALL retornar un arreglo JSON donde cada elemento incluye: `id_servicio`, `nombre`, `descripcion`, `precio`, `duracion_minutos` y `categoria`.
3. THE API SHALL obtener el nombre de la categoría haciendo JOIN con la tabla `CATEGORIAS` usando el campo `ID_CATEGORIA`.
4. IF la consulta a `SERVICIOS` falla por error de BD, THEN THE API SHALL retornar código HTTP 500 con un cuerpo JSON `{ "error": "Error interno del servidor" }`.
5. WHEN el Frontend carga la Seccion_Servicios, THE Frontend SHALL consumir `GET /api/v1/servicios` y renderizar las tarjetas con los datos recibidos de la BD.
6. WHILE el Frontend espera la respuesta de la API, THE Seccion_Servicios SHALL mostrar un indicador de carga (skeleton) en lugar de contenido vacío.
7. IF la llamada a `GET /api/v1/servicios` falla, THEN THE Seccion_Servicios SHALL mostrar un mensaje de error amigable sin interrumpir el resto de la página.

---

### Requisito 3: Endpoint de autenticación de usuarios

**Historia de usuario:** Como usuario del sistema, quiero poder iniciar sesión con mis credenciales, para acceder a las funcionalidades correspondientes a mi rol.

#### Criterios de aceptación

1. THE API SHALL exponer el endpoint `POST /api/v1/auth/login` que recibe `usuario` y `password` en el cuerpo de la solicitud.
2. WHEN se llama a `POST /api/v1/auth/login` con credenciales válidas, THE API SHALL consultar la tabla `USUARIOS` de la BD verificando que el campo `USUARIO` coincida y que `ESTADO = 1`.
3. WHEN las credenciales son válidas, THE API SHALL retornar código HTTP 200 con un cuerpo JSON que incluya: `token` (Token_JWT), `id_usuario`, `nombre`, `apellido`, `rol` (nombre del rol desde tabla `ROLES`) y `especialidad`.
4. IF el campo `usuario` o `password` está ausente en el cuerpo de `POST /api/v1/auth/login`, THEN THE API SHALL retornar código HTTP 400 con un cuerpo JSON `{ "error": "Los campos usuario y password son requeridos" }`.
5. IF las credenciales no coinciden con ningún Usuario activo en la BD, THEN THE API SHALL retornar código HTTP 401 con un cuerpo JSON `{ "error": "Credenciales inválidas" }`.
6. THE Token_JWT SHALL incluir en su payload: `id_usuario`, `rol` y una fecha de expiración de 8 horas.
7. THE Backend SHALL firmar el Token_JWT usando una clave secreta leída desde la variable de entorno `JWT_SECRET`.
8. THE Backend SHALL comparar la contraseña recibida con el hash almacenado en `USUARIOS.PASSWORD` usando bcrypt.

---

### Requisito 4: Middleware de autenticación

**Historia de usuario:** Como desarrollador, quiero que los endpoints protegidos validen el Token_JWT antes de procesar la solicitud, para garantizar que solo usuarios autenticados accedan a recursos restringidos.

#### Criterios de aceptación

1. THE Backend SHALL implementar un middleware `authMiddleware` que extraiga el Token_JWT del header `Authorization: Bearer <token>`.
2. IF el header `Authorization` está ausente o no tiene formato `Bearer <token>`, THEN THE authMiddleware SHALL retornar código HTTP 401 con `{ "error": "Token requerido" }`.
3. IF el Token_JWT está expirado o tiene firma inválida, THEN THE authMiddleware SHALL retornar código HTTP 401 con `{ "error": "Token inválido o expirado" }`.
4. WHEN el Token_JWT es válido, THE authMiddleware SHALL adjuntar el payload decodificado (`id_usuario`, `rol`) al objeto `request` para uso en los controllers.
5. THE Backend SHALL aplicar el authMiddleware a todos los endpoints del Panel_Admin (`/api/v1/admin/*`).

---

### Requisito 5: Control de acceso basado en roles

**Historia de usuario:** Como sistema, quiero restringir el acceso a recursos según el rol del usuario autenticado, para que cada usuario solo vea y opere lo que le corresponde.

#### Criterios de aceptación

1. THE Backend SHALL implementar un middleware `roleMiddleware` que verifique que el rol del usuario autenticado pertenezca a los roles permitidos para el endpoint solicitado.
2. IF el rol del usuario autenticado no está en la lista de roles permitidos para el endpoint, THEN THE roleMiddleware SHALL retornar código HTTP 403 con `{ "error": "Acceso denegado: rol insuficiente" }`.
3. THE API SHALL proteger los endpoints de gestión (`/api/v1/admin/reservas`, `/api/v1/admin/empleados`) con el roleMiddleware, permitiendo únicamente Rol_Administrativo.
4. THE API SHALL permitir el acceso a `GET /api/v1/servicios` y `POST /api/v1/reservas` sin autenticación, para que los clientes puedan consultar servicios y crear reservas.

---

### Requisito 6: Componente de Login en el Frontend

**Historia de usuario:** Como usuario del sistema, quiero ver un formulario de inicio de sesión en el sitio web, para poder autenticarme y acceder a mi vista personalizada.

#### Criterios de aceptación

1. THE Frontend SHALL incluir un componente Login_Form con campos para `usuario` y `password`, y un botón de envío.
2. WHEN el usuario envía el Login_Form con credenciales válidas, THE Frontend SHALL llamar a `POST /api/v1/auth/login` y almacenar el Token_JWT y los datos del usuario en el Auth_Context.
3. WHEN el usuario envía el Login_Form, THE Frontend SHALL deshabilitar el botón de envío durante la solicitud para evitar envíos duplicados.
4. IF la llamada a `POST /api/v1/auth/login` retorna error, THEN THE Login_Form SHALL mostrar el mensaje de error recibido sin recargar la página.
5. THE Frontend SHALL persistir el Token_JWT en `localStorage` para mantener la sesión activa al recargar la página.
6. THE Frontend SHALL incluir una opción de cierre de sesión que limpie el Auth_Context y el Token_JWT de `localStorage`.
7. WHEN el usuario recarga la página y existe un Token_JWT válido en `localStorage`, THE Frontend SHALL restaurar el estado de autenticación sin requerir nuevo login.

---

### Requisito 7: Enrutamiento condicional por rol

**Historia de usuario:** Como usuario autenticado, quiero que el sistema me redirija automáticamente a la vista correspondiente a mi rol, para acceder directamente a las funcionalidades que me corresponden.

#### Criterios de aceptación

1. WHEN un usuario con Rol_Administrativo se autentica exitosamente, THE Frontend SHALL mostrar el Panel_Admin ocultando la vista pública del sitio.
2. WHEN un usuario con Rol_Cliente se autentica exitosamente, THE Frontend SHALL mostrar únicamente la Vista_Reserva con el formulario de reserva.
3. WHEN un usuario no autenticado accede al sitio, THE Frontend SHALL mostrar la página pública (Hero, servicios, equipo, formulario de reserva) con la opción de iniciar sesión en la Navbar.
4. IF un usuario no autenticado intenta acceder a una ruta protegida del Panel_Admin, THEN THE Frontend SHALL redirigirlo al Login_Form.
5. THE Frontend SHALL implementar el Auth_Context usando React Context API para compartir el estado de autenticación entre todos los componentes.

---

### Requisito 8: Panel de administración/empleado

**Historia de usuario:** Como empleado o administrador del salón, quiero acceder a un panel de gestión, para visualizar y administrar las reservas, servicios y datos del salón.

#### Criterios de aceptación

1. THE Panel_Admin SHALL mostrar al menos las siguientes secciones: lista de reservas del día, lista de servicios activos y datos del usuario autenticado (nombre, rol).
2. WHEN el Panel_Admin carga, THE Frontend SHALL llamar a `GET /api/v1/admin/reservas` con el Token_JWT en el header `Authorization` para obtener las reservas.
3. THE API SHALL exponer el endpoint `GET /api/v1/admin/reservas` protegido por authMiddleware y roleMiddleware (solo Rol_Administrativo), que retorna las reservas del día actual.
4. WHEN se llama a `GET /api/v1/admin/reservas`, THE API SHALL retornar un arreglo JSON donde cada elemento incluye: `id_reserva`, `cliente`, `servicio`, `empleado`, `fecha_reserva`, `hora_reserva`, `estado` y `observacion`.
5. THE Panel_Admin SHALL mostrar el nombre y rol del usuario autenticado en un encabezado visible.
6. IF la llamada a `GET /api/v1/admin/reservas` falla por token inválido, THEN THE Frontend SHALL limpiar el Auth_Context y redirigir al Login_Form.

---

### Requisito 9: Vista de reserva para clientes

**Historia de usuario:** Como cliente autenticado, quiero acceder a un formulario de reserva simplificado, para agendar mi cita de forma rápida sin ver funcionalidades administrativas.

#### Criterios de aceptación

1. THE Vista_Reserva SHALL mostrar únicamente el formulario de reserva con los campos: servicio (selector desde BD), fecha, hora y observación.
2. WHEN la Vista_Reserva carga, THE Frontend SHALL consumir `GET /api/v1/servicios` para poblar el selector de servicios.
3. WHEN el cliente envía la reserva desde la Vista_Reserva, THE Frontend SHALL llamar a `POST /api/v1/reservas` con los datos del formulario.
4. WHEN la reserva se crea exitosamente, THE Vista_Reserva SHALL mostrar un mensaje de confirmación con el número de reserva generado.
5. IF la creación de la reserva falla, THEN THE Vista_Reserva SHALL mostrar el mensaje de error recibido de la API sin recargar la página.
