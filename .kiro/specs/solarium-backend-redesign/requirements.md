# Documento de Requisitos

## Introducción

Este documento describe los requisitos para la mejora visual y la integración de backend del sitio web del salón de belleza **Solarium**. El proyecto consiste en dos grandes áreas:

1. **Rediseño visual del frontend**: Elevar la estética del sitio a un nivel premium y elegante, acorde con la identidad de un salón de belleza de alta gama, y corregir problemas técnicos existentes en el código CSS.
2. **Backend con API REST**: Crear un servidor Node.js/Express que se conecte a la base de datos SQL Server existente (`SalonBelleza`) y exponga endpoints para que el frontend consuma datos reales (servicios, empleados, reservas).

El frontend está construido con React + Vite + TypeScript + Tailwind CSS v4. El backend se construirá con Node.js + Express con TypeScript y se conectará a SQL Server mediante el driver `mssql`.

---

## Glosario

- **Sistema**: El conjunto completo formado por el Frontend y el Backend de Solarium.
- **Frontend**: La aplicación React/Vite/TypeScript que el usuario final visualiza en el navegador.
- **Backend**: El servidor Node.js/Express/TypeScript que expone la API REST.
- **API**: La interfaz REST que el Backend expone para que el Frontend consuma datos.
- **BD**: La base de datos SQL Server `SalonBelleza` ya existente.
- **Cliente**: El usuario final que visita el sitio web y puede agendar una cita.
- **Administrador**: Usuario interno del salón que gestiona reservas y datos.
- **Reserva**: Un registro en la tabla `Trabajo` que representa una cita agendada.
- **Servicio**: Un registro en la tabla `Servicio` de la BD que describe un tratamiento ofrecido.
- **Empleado**: Un registro en la tabla `Empleado` de la BD que representa a un estilista activo.
- **Formulario_Reserva**: El componente del Frontend que permite al Cliente agendar una cita.
- **Sección_Servicios**: El componente del Frontend que muestra la lista de servicios disponibles.
- **Sección_Equipo**: El componente del Frontend que muestra los empleados activos del salón.
- **CSS_Global**: El archivo `index.css` que contiene los estilos base del Frontend.
- **Estado_Reserva**: Uno de los valores válidos para el campo `estado` de la tabla `Trabajo`: `PENDIENTE`, `CONFIRMADO`, `EN_PROCESO`, `COMPLETADO`, `CANCELADO`.

---

## Requisitos

### Requisito 1: Corrección de estilos CSS duplicados

**Historia de usuario:** Como desarrollador, quiero que los estilos base estén definidos en un único archivo, para evitar conflictos de especificidad y facilitar el mantenimiento del código.

#### Criterios de aceptación

1. THE Frontend SHALL consolidar todos los estilos base (scroll-behavior, body, animaciones, scrollbar, focus de inputs) únicamente en el archivo `index.css`.
2. THE Frontend SHALL mantener el archivo `App.css` vacío o eliminado, sin duplicar ninguna regla ya definida en `CSS_Global`.
3. WHEN el Frontend se compila, THE Frontend SHALL producir un bundle sin reglas CSS duplicadas para los selectores `body`, `*`, `section`, `::-webkit-scrollbar` e `input:focus`.

---

### Requisito 2: Rediseño visual premium del Frontend

**Historia de usuario:** Como dueño del salón, quiero que el sitio web tenga una estética más elegante y profesional, para transmitir la imagen premium de Solarium y atraer más clientes.

#### Criterios de aceptación

1. THE Frontend SHALL aplicar una paleta de colores coherente con la identidad premium del salón, utilizando tonos dorados/champagne, negro profundo y blanco marfil como colores principales.
2. THE Frontend SHALL mostrar tipografía serif o display para los títulos principales de cada sección, diferenciándola visualmente de los textos de cuerpo.
3. THE Frontend SHALL presentar la sección Hero con una imagen de fondo real (o gradiente de alta calidad) en lugar de un fondo plano, incluyendo un llamado a la acción visible y contrastado.
4. WHEN el usuario navega por el sitio en un dispositivo móvil (viewport menor a 768px), THE Frontend SHALL adaptar todos los layouts a una columna única sin desbordamiento horizontal.
5. THE Frontend SHALL mostrar animaciones de entrada suaves (fade-in o slide-up) en las tarjetas de servicios, equipo y testimonios al hacer scroll hacia ellas.
6. THE Frontend SHALL incluir un botón de reserva fijo visible durante el scroll que lleve directamente al Formulario_Reserva.

---

### Requisito 3: Creación del Backend con API REST

**Historia de usuario:** Como desarrollador, quiero un servidor Node.js/Express que exponga una API REST conectada a la BD, para que el Frontend pueda consumir datos reales en lugar de datos hardcodeados.

#### Criterios de aceptación

1. THE Backend SHALL exponer sus endpoints bajo el prefijo de ruta `/api/v1`.
2. THE Backend SHALL conectarse a la BD utilizando las credenciales de conexión definidas en variables de entorno, sin incluir credenciales en el código fuente.
3. WHEN el Backend inicia y la conexión a la BD falla, THE Backend SHALL registrar el error en consola y terminar el proceso con código de salida distinto de cero.
4. THE Backend SHALL responder a todas las solicitudes con cabeceras CORS que permitan peticiones desde el origen del Frontend.
5. THE Backend SHALL incluir un archivo `.env.example` que documente todas las variables de entorno requeridas: host, puerto de BD, usuario, contraseña, nombre de BD y puerto del servidor HTTP.
6. IF una solicitud a la API produce un error interno del servidor, THEN THE Backend SHALL responder con código HTTP 500 y un cuerpo JSON con la clave `error` describiendo el problema.
7. IF una solicitud a la API incluye parámetros inválidos o faltantes, THEN THE Backend SHALL responder con código HTTP 400 y un cuerpo JSON con la clave `error` describiendo la validación fallida.
8. THE Backend SHALL estar implementado en TypeScript, con tipos explícitos para los parámetros enviados a los stored procedures.

---

### Requisito 4: Endpoint de listado de servicios

**Historia de usuario:** Como visitante del sitio, quiero ver los servicios reales del salón cargados desde la base de datos, para tener información actualizada sobre precios y disponibilidad.

#### Criterios de aceptación

1. THE API SHALL exponer el endpoint `GET /api/v1/servicios` que retorna todos los servicios con `activo = 1` de la BD.
2. WHEN se llama a `GET /api/v1/servicios`, THE API SHALL retornar un arreglo JSON donde cada elemento incluye: `id_servicio`, `nombre`, `descripcion`, `duracion_min`, `precio` y `categoria`.
3. THE API SHALL exponer el endpoint `GET /api/v1/servicios/categoria/:id` que ejecuta el stored procedure `sp_ListarServiciosPorCategoria` con el `id_categoria` recibido.
4. WHEN se llama a `GET /api/v1/servicios/categoria/:id` con un `id` que no corresponde a ninguna categoría, THE API SHALL retornar un arreglo vacío con código HTTP 200.
5. THE API SHALL exponer el endpoint `GET /api/v1/categorias` que retorna todas las categorías con `activo = 1` de la BD.
6. WHEN el Frontend carga la Sección_Servicios, THE Frontend SHALL consumir `GET /api/v1/servicios` y renderizar las tarjetas con los datos recibidos de la BD, reemplazando los datos hardcodeados.
7. WHILE el Frontend espera la respuesta de la API, THE Sección_Servicios SHALL mostrar un indicador de carga (skeleton o spinner) en lugar de contenido vacío.
8. IF la llamada a `GET /api/v1/servicios` falla, THEN THE Sección_Servicios SHALL mostrar un mensaje de error amigable al usuario sin interrumpir el resto de la página.

---

### Requisito 5: Endpoint de listado de empleados

**Historia de usuario:** Como visitante del sitio, quiero ver el equipo real de estilistas cargado desde la base de datos, para conocer a los profesionales que me atenderán.

#### Criterios de aceptación

1. THE API SHALL exponer el endpoint `GET /api/v1/empleados` que ejecuta el stored procedure `sp_ListarEmpleadosActivos` y retorna los empleados con `activo = 1`.
2. WHEN se llama a `GET /api/v1/empleados`, THE API SHALL retornar un arreglo JSON donde cada elemento incluye: `id_empleado`, `nombre`, `apellido` y `especialidad`.
3. WHEN el Frontend carga la Sección_Equipo, THE Frontend SHALL consumir `GET /api/v1/empleados` y renderizar las tarjetas con los datos reales de la BD, reemplazando los datos hardcodeados.
4. WHILE el Frontend espera la respuesta de la API, THE Sección_Equipo SHALL mostrar un indicador de carga visible.
5. IF la llamada a `GET /api/v1/empleados` falla, THEN THE Sección_Equipo SHALL mostrar un mensaje de error amigable sin interrumpir la navegación.

---

### Requisito 6: Endpoint de creación de reservas

**Historia de usuario:** Como cliente del salón, quiero poder agendar una cita a través del formulario del sitio web, para que mi reserva quede registrada realmente en el sistema del salón.

#### Criterios de aceptación

1. THE API SHALL exponer el endpoint `POST /api/v1/reservas` que recibe los datos de la cita y ejecuta el stored procedure `sp_CrearReserva`.
2. WHEN se llama a `POST /api/v1/reservas` con datos válidos, THE API SHALL resolver el `id_cliente` mediante la lógica definida en el Requisito 7 antes de invocar `sp_CrearReserva`.
3. WHEN se llama a `POST /api/v1/reservas` con datos válidos, THE API SHALL retornar código HTTP 201 y un cuerpo JSON con el `id_trabajo` generado y un mensaje de confirmación.
4. IF el cuerpo de `POST /api/v1/reservas` omite alguno de los campos requeridos (`nombre`, `apellido`, `email`, `telefono`, `id_servicio`, `id_empleado`, `fecha_reserva`, `hora_reserva`), THEN THE API SHALL retornar código HTTP 400 con un mensaje que indique el campo faltante.
5. IF el `id_servicio` recibido no corresponde a un servicio con `activo = 1` en la BD, THEN THE API SHALL retornar código HTTP 422 con un mensaje indicando que el servicio no está disponible.
6. IF el `id_empleado` recibido no corresponde a un empleado con `activo = 1` en la BD, THEN THE API SHALL retornar código HTTP 422 con un mensaje indicando que el empleado no está disponible.
7. THE Backend SHALL combinar los campos `fecha_reserva` (formato `YYYY-MM-DD`) y `hora_reserva` (formato `HH:MM`) en un único valor `DATETIME` antes de pasarlo al stored procedure `sp_CrearReserva`.
8. WHEN el Cliente envía el Formulario_Reserva con datos válidos, THE Frontend SHALL llamar a `POST /api/v1/reservas` y mostrar un mensaje de confirmación de éxito al usuario.
9. WHEN el Cliente envía el Formulario_Reserva, THE Frontend SHALL deshabilitar el botón de envío durante la solicitud para evitar envíos duplicados.
10. IF la llamada a `POST /api/v1/reservas` retorna un error, THEN THE Formulario_Reserva SHALL mostrar el mensaje de error recibido de la API sin recargar la página.
11. THE Formulario_Reserva SHALL cargar la lista de servicios disponibles desde `GET /api/v1/servicios` para poblar el selector de servicios.
12. THE Formulario_Reserva SHALL cargar la lista de empleados activos desde `GET /api/v1/empleados` para poblar el selector de empleado preferido.

---

### Requisito 7: Registro y búsqueda de clientes

**Historia de usuario:** Como sistema, quiero gestionar los datos del cliente al momento de crear una reserva, para evitar duplicados y mantener un historial coherente.

#### Criterios de aceptación

1. WHEN se recibe una solicitud de reserva con un email que ya existe en la tabla `Cliente`, THE Backend SHALL reutilizar el `id_cliente` existente en lugar de crear un registro duplicado.
2. WHEN se recibe una solicitud de reserva con un email que no existe en la tabla `Cliente`, THE Backend SHALL insertar un nuevo registro en la tabla `Cliente` con los campos `nombre`, `apellido`, `telefono` y `email` proporcionados, antes de crear la reserva.
3. THE API SHALL exponer el endpoint `GET /api/v1/clientes/buscar?q=:texto` que ejecuta `sp_BuscarClientePorNombre` y retorna los clientes coincidentes.
4. IF el parámetro `q` de `GET /api/v1/clientes/buscar` está vacío o ausente, THEN THE API SHALL retornar código HTTP 400 con un mensaje de validación.
5. WHEN se llama a `GET /api/v1/clientes/buscar?q=:texto`, THE API SHALL retornar un arreglo JSON donde cada elemento incluye: `id_cliente`, `nombre`, `apellido`, `telefono` y `email`.

---

### Requisito 8: Gestión de estado de reservas

**Historia de usuario:** Como administrador del salón, quiero poder cambiar el estado de una reserva y consultar las reservas por fecha, para gestionar la agenda diaria del salón.

#### Criterios de aceptación

1. THE API SHALL exponer el endpoint `PATCH /api/v1/reservas/:id/estado` que ejecuta el stored procedure `sp_CambiarEstadoReserva` con el `id_trabajo` y el nuevo estado recibidos.
2. IF el cuerpo de `PATCH /api/v1/reservas/:id/estado` no incluye el campo `estado`, THEN THE API SHALL retornar código HTTP 400 con un mensaje de validación.
3. IF el campo `estado` recibido no es uno de los valores válidos del Estado_Reserva, THEN THE API SHALL retornar código HTTP 422 con un mensaje que liste los valores permitidos.
4. IF el `id` de `PATCH /api/v1/reservas/:id/estado` no corresponde a ninguna reserva en la BD, THEN THE API SHALL retornar código HTTP 404 con un mensaje indicando que la reserva no fue encontrada.
5. WHEN se llama a `PATCH /api/v1/reservas/:id/estado` con datos válidos, THE API SHALL retornar código HTTP 200 y un cuerpo JSON con el `id_trabajo` actualizado y el nuevo estado.
6. THE API SHALL exponer el endpoint `GET /api/v1/reservas?fecha_inicio=:fecha&fecha_fin=:fecha` que ejecuta el stored procedure `sp_ReservasPorFecha` con el rango de fechas recibido.
7. WHEN se llama a `GET /api/v1/reservas` con un rango de fechas válido, THE API SHALL retornar un arreglo JSON donde cada elemento incluye: `id_trabajo`, `cliente`, `empleado`, `servicio`, `fecha_reserva`, `estado` y `precio_cobrado`.
8. IF los parámetros `fecha_inicio` o `fecha_fin` están ausentes en `GET /api/v1/reservas`, THEN THE API SHALL retornar código HTTP 400 con un mensaje de validación.

---

### Requisito 9: Estructura y organización del Backend

**Historia de usuario:** Como desarrollador, quiero que el backend tenga una estructura de carpetas clara y mantenible, para facilitar futuras extensiones y el trabajo en equipo.

#### Criterios de aceptación

1. THE Backend SHALL organizarse en las carpetas: `src/routes/` (definición de rutas), `src/controllers/` (lógica de negocio) y `src/db/` (configuración y helpers de conexión a BD).
2. THE Backend SHALL incluir un archivo `package.json` con los scripts: `build` (compilar TypeScript), `start` (ejecutar build en producción) y `dev` (desarrollo con recarga automática).
3. THE Backend SHALL ubicarse en una carpeta separada del Frontend, denominada `solarium-api/`, dentro del mismo repositorio.
4. THE Backend SHALL incluir un archivo `README.md` con instrucciones de instalación, configuración de variables de entorno y ejecución.
5. THE Backend SHALL incluir un archivo `tsconfig.json` configurado para compilar TypeScript a JavaScript compatible con Node.js 18 o superior.
