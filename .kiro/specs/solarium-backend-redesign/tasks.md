# Plan de Implementación: Solarium Backend Redesign

## Visión General

Transformar el sitio estático de Solarium en una aplicación full-stack: crear el backend Node.js/Express/TypeScript con conexión a SQL Server, refactorizar el frontend React en componentes reutilizables que consuman la API, y aplicar el rediseño visual premium. Las tareas siguen un orden incremental donde cada paso construye sobre el anterior.

## Tareas

- [x] 1. Corregir estilos CSS duplicados en el frontend
  - Mover todas las reglas base (scroll-behavior, body, animaciones, scrollbar, input:focus) de `App.css` a `index.css`
  - Vaciar `App.css` por completo (dejar solo un comentario indicando que está vacío intencionalmente)
  - Definir las variables CSS de la paleta premium en `:root` dentro de `index.css`: `--color-dorado`, `--color-champagne`, `--color-negro`, `--color-marfil`, `--color-gris-suave`
  - Agregar `@import` de Google Fonts (Playfair Display + Inter) en `index.css`
  - _Requisitos: 1.1, 1.2, 1.3, 2.1, 2.2_

- [x] 2. Crear la estructura del backend `solarium-api/`
  - [x] 2.1 Inicializar el proyecto Node.js/TypeScript
    - Crear `solarium-api/package.json` con dependencias: `express`, `mssql`, `dotenv`, `cors`; devDependencies: `typescript`, `ts-node-dev`, `@types/express`, `@types/mssql`, `@types/cors`, `vitest`, `fast-check`
    - Crear `solarium-api/tsconfig.json` configurado para Node.js 18+ (target ES2022, module CommonJS, outDir `dist/`, rootDir `src/`)
    - Crear `solarium-api/.env.example` con las variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `CORS_ORIGIN`
    - Crear `solarium-api/README.md` con instrucciones de instalación, configuración y ejecución
    - _Requisitos: 3.2, 3.5, 9.2, 9.3, 9.4, 9.5_

  - [x] 2.2 Crear los tipos TypeScript compartidos del backend
    - Crear `solarium-api/src/types/index.ts` con las interfaces: `Categoria`, `Servicio`, `Empleado`, `Cliente`, `Reserva`, `EstadoReserva`, `ParamsCrearReserva`, `ParamsCambiarEstado`, `BodyCrearReserva`, `ApiError`, `ApiSuccess<T>`
    - _Requisitos: 3.8, 9.1_

  - [x] 2.3 Crear la estructura de carpetas y el entry point
    - Crear directorios: `src/db/`, `src/routes/`, `src/controllers/`
    - Crear `solarium-api/src/app.ts` con la configuración Express: middlewares de JSON, CORS (leyendo `CORS_ORIGIN` de env), y registro de rutas bajo `/api/v1`
    - Crear `solarium-api/index.ts` como entry point: inicializa el pool, levanta el servidor; si el pool falla, loguea el error y llama `process.exit(1)`
    - _Requisitos: 3.1, 3.3, 3.4, 9.1_

- [x] 3. Implementar el pool de conexiones SQL Server
  - [x] 3.1 Crear el módulo del pool de conexiones
    - Crear `solarium-api/src/db/pool.ts` con la función `getPool()` que retorna un singleton de `sql.ConnectionPool`
    - Configurar el pool con las variables de entorno: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`; opciones `encrypt: false`, `trustServerCertificate: true`; pool `max: 10`, `min: 2`, `idleTimeoutMillis: 30000`
    - _Requisitos: 3.2, 3.3_

  - [ ]* 3.2 Escribir test de propiedad para la combinación de fecha y hora
    - **Propiedad 9: La combinación de fecha y hora produce un DATETIME válido**
    - **Valida: Requisito 6.7**
    - Crear `solarium-api/src/utils/dateUtils.ts` con la función `combinarFechaHora(fecha: string, hora: string): Date`
    - Usar `fast-check` para generar pares aleatorios de fechas `YYYY-MM-DD` y horas `HH:MM` válidas y verificar que el resultado no sea `Invalid Date` y corresponda exactamente a los valores de entrada
    - Crear el archivo de test en `solarium-api/src/utils/dateUtils.test.ts`

- [x] 4. Implementar endpoints de servicios y categorías
  - [x] 4.1 Crear el controlador de servicios
    - Crear `solarium-api/src/controllers/serviciosController.ts` con los handlers: `listarServicios` (query directa a `Servicio` con `activo = 1` incluyendo join a `Categoria`), `listarPorCategoria` (ejecuta `sp_ListarServiciosPorCategoria`), `listarCategorias` (query a `Categoria` con `activo = 1`)
    - Envolver cada handler en `try/catch`; errores internos responden HTTP 500 con `{ error: string }`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 3.6_

  - [x] 4.2 Crear el router de servicios y registrarlo en la app
    - Crear `solarium-api/src/routes/servicios.ts` con las rutas: `GET /servicios`, `GET /servicios/categoria/:id`, `GET /categorias`
    - Registrar el router en `app.ts` bajo el prefijo `/api/v1`
    - _Requisitos: 3.1, 4.1, 4.3, 4.5_

  - [ ]* 4.3 Escribir test de propiedad: solo registros activos en listados
    - **Propiedad 1: Solo se retornan registros activos en los listados**
    - **Valida: Requisitos 4.1, 4.5**
    - Crear `solarium-api/src/controllers/serviciosController.test.ts`
    - Usar `fast-check` para generar arrays de servicios/categorías con mezcla aleatoria de `activo = 0` y `activo = 1`; verificar que el filtrado retorna únicamente los activos

  - [ ]* 4.4 Escribir test de propiedad: respuestas contienen todos los campos requeridos
    - **Propiedad 2: Las respuestas contienen todos los campos requeridos (Servicio)**
    - **Valida: Requisito 4.2**
    - En el mismo archivo de test, usar `fast-check` para generar objetos `Servicio` aleatorios y verificar que cada elemento contiene exactamente: `id_servicio`, `nombre`, `descripcion`, `duracion_min`, `precio`, `categoria`

  - [ ]* 4.5 Escribir test de propiedad: filtrado por categoría retorna solo servicios de esa categoría
    - **Propiedad 3: El filtrado por categoría retorna solo servicios de esa categoría**
    - **Valida: Requisito 4.3**
    - Usar `fast-check` para generar un `id_categoria` y un array de servicios con categorías mixtas; verificar que el resultado solo contiene servicios de la categoría solicitada

- [x] 5. Implementar endpoint de empleados
  - [x] 5.1 Crear el controlador y router de empleados
    - Crear `solarium-api/src/controllers/empleadosController.ts` con el handler `listarEmpleados` que ejecuta `sp_ListarEmpleadosActivos`
    - Crear `solarium-api/src/routes/empleados.ts` con la ruta `GET /empleados`
    - Registrar el router en `app.ts` bajo `/api/v1`
    - _Requisitos: 5.1, 5.2, 3.1_

  - [ ]* 5.2 Escribir test de propiedad: respuestas contienen todos los campos requeridos (Empleado)
    - **Propiedad 2: Las respuestas contienen todos los campos requeridos (Empleado)**
    - **Valida: Requisito 5.2**
    - Crear `solarium-api/src/controllers/empleadosController.test.ts`
    - Usar `fast-check` para generar objetos `Empleado` aleatorios y verificar que cada elemento contiene exactamente: `id_empleado`, `nombre`, `apellido`, `especialidad`

  - [ ]* 5.3 Escribir test de propiedad: solo empleados activos en el listado
    - **Propiedad 1: Solo se retornan registros activos (Empleado)**
    - **Valida: Requisito 5.1**
    - En el mismo archivo de test, usar `fast-check` para generar arrays de empleados con mezcla aleatoria de `activo = 0` y `activo = 1`; verificar que el resultado solo contiene activos

- [ ] 6. Checkpoint — Verificar que el backend compila y los tests pasan
  - Asegurarse de que `tsc --noEmit` no reporta errores en `solarium-api/`
  - Asegurarse de que todos los tests de propiedades implementados hasta aquí pasan
  - Preguntar al usuario si hay dudas antes de continuar

- [x] 7. Implementar endpoint de creación de reservas con gestión de clientes
  - [x] 7.1 Crear la utilidad de combinación de fecha y hora
    - Crear `solarium-api/src/utils/dateUtils.ts` con `combinarFechaHora(fecha: string, hora: string): Date`
    - _Requisitos: 6.7_

  - [x] 7.2 Crear el controlador de clientes
    - Crear `solarium-api/src/controllers/clientesController.ts` con:
      - `resolverCliente(email, nombre, apellido, telefono)`: busca por email en `Cliente`; si existe retorna `id_cliente` existente; si no, inserta nuevo registro y retorna el `id_cliente` generado
      - `buscarClientes`: ejecuta `sp_BuscarClientePorNombre` con el parámetro `q`; valida que `q` no esté vacío (HTTP 400 si falta)
    - Crear `solarium-api/src/routes/clientes.ts` con la ruta `GET /clientes/buscar`
    - Registrar el router en `app.ts` bajo `/api/v1`
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.3 Crear el controlador de reservas
    - Crear `solarium-api/src/controllers/reservasController.ts` con el handler `crearReserva`:
      - Validar campos requeridos: `nombre`, `apellido`, `email`, `telefono`, `id_servicio`, `id_empleado`, `fecha_reserva`, `hora_reserva`; retornar HTTP 400 si falta alguno
      - Verificar que `id_servicio` corresponde a un servicio con `activo = 1`; retornar HTTP 422 si no
      - Verificar que `id_empleado` corresponde a un empleado con `activo = 1`; retornar HTTP 422 si no
      - Llamar a `resolverCliente` para obtener `id_cliente`
      - Combinar `fecha_reserva` + `hora_reserva` con `combinarFechaHora`
      - Ejecutar `sp_CrearReserva` y retornar HTTP 201 con `{ id_trabajo, mensaje }`
    - Crear `solarium-api/src/routes/reservas.ts` con la ruta `POST /reservas`
    - Registrar el router en `app.ts` bajo `/api/v1`
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 7.4 Escribir test de propiedad: email existente reutiliza id_cliente
    - **Propiedad 11: Un email ya registrado reutiliza el `id_cliente` existente**
    - **Valida: Requisito 7.1**
    - Crear `solarium-api/src/controllers/clientesController.test.ts`
    - Usar `fast-check` para generar emails aleatorios y verificar que llamadas sucesivas con el mismo email retornan el mismo `id_cliente` sin crear duplicados

  - [ ]* 7.5 Escribir test de propiedad: email nuevo crea exactamente un registro en Cliente
    - **Propiedad 12: Un email nuevo crea exactamente un registro en `Cliente`**
    - **Valida: Requisito 7.2**
    - En el mismo archivo de test, usar `fast-check` para generar emails únicos y verificar que después de `resolverCliente` existe exactamente un registro con ese email

  - [ ]* 7.6 Escribir test de propiedad: parámetros inválidos retornan HTTP 400
    - **Propiedad 7: Los parámetros inválidos o faltantes retornan HTTP 400 con cuerpo `{ error }`**
    - **Valida: Requisitos 3.7, 6.4, 7.4**
    - Crear `solarium-api/src/controllers/reservasController.test.ts`
    - Usar `fast-check` para generar bodies de reserva con campos requeridos omitidos aleatoriamente; verificar que la respuesta es siempre HTTP 400 con `{ error: string }` no vacío

- [x] 8. Implementar endpoint de gestión de estado de reservas
  - [x] 8.1 Agregar handlers de reservas al controlador existente
    - Agregar a `reservasController.ts` el handler `cambiarEstado`:
      - Validar que el body incluye `estado`; retornar HTTP 400 si falta
      - Validar que `estado` es uno de los valores de `EstadoReserva`; retornar HTTP 422 con lista de valores permitidos si no es válido
      - Ejecutar `sp_CambiarEstadoReserva`; si no afecta ninguna fila, retornar HTTP 404
      - Retornar HTTP 200 con `{ id_trabajo, estado }`
    - Agregar el handler `listarReservasPorFecha`:
      - Validar que `fecha_inicio` y `fecha_fin` están presentes en query params; retornar HTTP 400 si faltan
      - Ejecutar `sp_ReservasPorFecha` y retornar el arreglo de reservas
    - Agregar las rutas `PATCH /reservas/:id/estado` y `GET /reservas` al router de reservas
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 8.2 Escribir test de propiedad: estado inválido retorna HTTP 422
    - **Propiedad 14: Un estado inválido en PATCH retorna HTTP 422**
    - **Valida: Requisito 8.3**
    - En `reservasController.test.ts`, usar `fast-check` para generar strings que no sean valores válidos de `EstadoReserva` y verificar que la respuesta es siempre HTTP 422 con cuerpo `{ error }` que lista los valores permitidos

  - [ ]* 8.3 Escribir test de propiedad: reservas por fecha dentro del rango solicitado
    - **Propiedad 15: Las reservas por fecha retornan solo reservas dentro del rango solicitado**
    - **Valida: Requisito 8.6**
    - Usar `fast-check` para generar pares de fechas válidas `fecha_inicio <= fecha_fin` y arrays de reservas con fechas mixtas; verificar que el filtrado retorna solo reservas dentro del rango

  - [ ]* 8.4 Escribir test de propiedad: todos los endpoints bajo `/api/v1`
    - **Propiedad 4: Todos los endpoints están bajo el prefijo `/api/v1`**
    - **Valida: Requisito 3.1**
    - Crear `solarium-api/src/app.test.ts`
    - Usar `fast-check` para generar rutas aleatorias y verificar que ninguna ruta registrada en Express es accesible fuera del prefijo `/api/v1`

  - [ ]* 8.5 Escribir test de propiedad: todas las respuestas incluyen cabeceras CORS
    - **Propiedad 5: Todas las respuestas incluyen cabeceras CORS**
    - **Valida: Requisito 3.4**
    - En el mismo archivo de test, usar `fast-check` para generar combinaciones de método + ruta y verificar que la respuesta siempre incluye `Access-Control-Allow-Origin`

  - [ ]* 8.6 Escribir test de propiedad: errores internos retornan HTTP 500 con `{ error }`
    - **Propiedad 6: Los errores internos retornan HTTP 500 con cuerpo `{ error }`**
    - **Valida: Requisito 3.6**
    - Usar `fast-check` para simular excepciones en los controllers y verificar que la respuesta es siempre HTTP 500 con `{ error: string }` no vacío

- [ ] 9. Checkpoint — Verificar que todos los endpoints del backend funcionan
  - Asegurarse de que `tsc --noEmit` no reporta errores en `solarium-api/`
  - Asegurarse de que todos los tests de propiedades del backend pasan
  - Preguntar al usuario si hay dudas antes de continuar con el frontend

- [x] 10. Crear los tipos y hooks del frontend
  - [x] 10.1 Crear los tipos TypeScript del frontend
    - Crear `Solarium/src/types/api.ts` con las interfaces: `Servicio`, `Empleado`, `FormularioReservaData`, `EstadoReserva`, `ReservaCreada`
    - _Requisitos: 4.6, 5.3, 6.8_

  - [x] 10.2 Crear los hooks de fetching
    - Crear `Solarium/src/hooks/useServicios.ts` que expone `{ data: Servicio[], loading: boolean, error: string | null }` consumiendo `GET /api/v1/servicios`
    - Crear `Solarium/src/hooks/useEmpleados.ts` que expone `{ data: Empleado[], loading: boolean, error: string | null }` consumiendo `GET /api/v1/empleados`
    - La URL base de la API debe leerse de `import.meta.env.VITE_API_URL`
    - _Requisitos: 4.6, 4.7, 4.8, 5.3, 5.4, 5.5_

- [x] 11. Crear los componentes UI base del frontend
  - [x] 11.1 Crear los componentes de estado de carga y error
    - Crear `Solarium/src/components/ui/SkeletonCard.tsx`: rectángulo animado con `animate-pulse` de Tailwind
    - Crear `Solarium/src/components/ui/MensajeError.tsx`: mensaje de error amigable con prop `mensaje: string`
    - _Requisitos: 4.7, 4.8, 5.4, 5.5_

  - [ ]* 11.2 Escribir test de propiedad: componentes de listado renderizan exactamente N tarjetas
    - **Propiedad 8: Los componentes de listado renderizan exactamente N tarjetas dado un array de N elementos**
    - **Valida: Requisitos 4.6, 5.3, 6.11, 6.12**
    - Crear `Solarium/src/components/SeccionServicios.test.tsx` y `SeccionEquipo.test.tsx`
    - Usar `fast-check` con React Testing Library para generar arrays de N elementos aleatorios y verificar que el componente renderiza exactamente N tarjetas en el DOM

- [x] 12. Refactorizar el frontend en componentes
  - [x] 12.1 Crear los componentes de navegación y hero
    - Crear `Solarium/src/components/Navbar.tsx` extrayendo la lógica del menú de `App.tsx` (incluyendo estado `menuOpen`)
    - Crear `Solarium/src/components/Hero.tsx` con imagen de fondo `hero.png`, overlay oscuro semitransparente, gradiente dorado en el CTA y enlace a `#booking`
    - Crear `Solarium/src/components/BotonReservaFijo.tsx`: botón `fixed bottom-6 right-6` con fondo dorado, sombra pronunciada, enlace a `#booking`
    - _Requisitos: 2.3, 2.6_

  - [x] 12.2 Crear la sección de servicios con datos reales
    - Crear `Solarium/src/components/SeccionServicios.tsx` que usa `useServicios()`: muestra `SkeletonCard` mientras `loading`, `MensajeError` si `error`, y las tarjetas reales con datos de la API
    - Aplicar animaciones de entrada con `IntersectionObserver` y clase `visible` que activa `fadeInUp`
    - _Requisitos: 4.6, 4.7, 4.8, 2.5_

  - [x] 12.3 Crear la sección de equipo con datos reales
    - Crear `Solarium/src/components/SeccionEquipo.tsx` que usa `useEmpleados()`: muestra `SkeletonCard` mientras `loading`, `MensajeError` si `error`, y las tarjetas reales con datos de la API
    - Aplicar animaciones de entrada con `IntersectionObserver`
    - _Requisitos: 5.3, 5.4, 5.5, 2.5_

  - [x] 12.4 Crear los componentes restantes
    - Crear `Solarium/src/components/SeccionTestimonios.tsx` extrayendo la sección de testimonios de `App.tsx`
    - Crear `Solarium/src/components/Galeria.tsx` extrayendo la sección de galería de `App.tsx`
    - Crear `Solarium/src/components/Contacto.tsx` extrayendo la sección de contacto de `App.tsx`
    - _Requisitos: 2.4_

  - [x] 12.5 Crear el formulario de reserva conectado a la API
    - Crear `Solarium/src/components/FormularioReserva.tsx`:
      - Cargar servicios con `useServicios()` y empleados con `useEmpleados()` para poblar los selectores
      - Campos: `nombre`, `apellido`, `email`, `telefono`, `id_servicio`, `id_empleado`, `fecha_reserva`, `hora_reserva`
      - Estado `submitting`: deshabilitar el botón de envío mientras la petición está en curso
      - Al enviar: llamar a `POST /api/v1/reservas`; mostrar mensaje de confirmación en éxito; mostrar error inline de la API en caso de fallo, sin recargar la página
    - _Requisitos: 6.8, 6.9, 6.10, 6.11, 6.12_

  - [ ]* 12.6 Escribir test de propiedad: botón deshabilitado durante el envío
    - **Propiedad 10: El botón de envío está deshabilitado durante la solicitud en curso**
    - **Valida: Requisito 6.9**
    - Crear `Solarium/src/components/FormularioReserva.test.tsx`
    - Usar `fast-check` con React Testing Library para generar estados `submitting = true/false` y verificar que el botón tiene/no tiene el atributo `disabled` correspondientemente

  - [ ]* 12.7 Escribir test de propiedad: búsqueda de clientes retorna solo coincidencias
    - **Propiedad 13: La búsqueda de clientes retorna solo coincidencias con el texto buscado**
    - **Valida: Requisito 7.3**
    - Crear `solarium-api/src/controllers/clientesController.buscar.test.ts`
    - Usar `fast-check` para generar texto de búsqueda `q` y arrays de clientes con nombres mixtos; verificar que el resultado solo contiene clientes cuyo `nombre` o `apellido` contiene `q` (case-insensitive)

  - [ ]* 12.8 Escribir test de propiedad: respuestas contienen todos los campos requeridos (Cliente y Reserva)
    - **Propiedad 2: Las respuestas contienen todos los campos requeridos (Cliente y Reserva)**
    - **Valida: Requisitos 7.5, 8.7**
    - Usar `fast-check` para generar objetos `Cliente` y `Reserva` aleatorios y verificar que contienen exactamente los campos especificados en el diseño

  - [x] 12.9 Actualizar `App.tsx` para componer todos los componentes
    - Reemplazar el contenido de `App.tsx` por la composición de: `Navbar`, `Hero`, `SeccionServicios`, `Galeria`, `SeccionEquipo`, `SeccionTestimonios`, `FormularioReserva` (con id `booking`), `Contacto`, `BotonReservaFijo`
    - Eliminar todos los datos hardcodeados (`services`, `team`, `gallery`, `testimonials`) de `App.tsx`
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.6, 5.3_

- [x] 13. Aplicar el rediseño visual premium
  - [x] 13.1 Aplicar la paleta de colores y tipografía premium
    - Actualizar `index.css` para usar las variables `--color-dorado`, `--color-champagne`, `--color-negro`, `--color-marfil` en los estilos base
    - Aplicar `font-family: 'Playfair Display', serif` a los selectores `h1, h2, h3` en `index.css`
    - Aplicar `font-family: 'Inter', sans-serif` al `body` en `index.css`
    - _Requisitos: 2.1, 2.2_

  - [x] 13.2 Aplicar estilos premium a los componentes
    - Actualizar `Hero.tsx` para usar imagen de fondo `hero.png` con overlay oscuro semitransparente y CTA con gradiente dorado (`--color-dorado`)
    - Actualizar las tarjetas de `SeccionServicios.tsx` para mostrar borde dorado sutil en hover y precio en `--color-dorado`
    - Actualizar `BotonReservaFijo.tsx` con fondo `--color-dorado` y sombra pronunciada
    - Verificar que todos los layouts son de una columna en viewport menor a 768px (sin desbordamiento horizontal)
    - _Requisitos: 2.1, 2.3, 2.4, 2.6_

- [-] 14. Checkpoint final — Verificar integración completa
  - Asegurarse de que `tsc --noEmit` no reporta errores en `Solarium/` ni en `solarium-api/`
  - Asegurarse de que todos los tests de propiedades pasan con `vitest --run` en ambos proyectos
  - Preguntar al usuario si hay dudas antes de dar por completada la implementación

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints garantizan validación incremental antes de avanzar a la siguiente fase
- Los tests de propiedades usan `fast-check` con mínimo 100 iteraciones por propiedad
- La URL base de la API en el frontend se configura mediante la variable de entorno `VITE_API_URL`
