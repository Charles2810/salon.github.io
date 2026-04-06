# Plan de Implementación: solarium-db-auth-feature

## Visión General

Implementación en tres ejes: (1) reconexión del pool a `DB_TiendaBelleza`, (2) adaptación del endpoint de servicios al esquema real, y (3) autenticación JWT con RBAC en backend y frontend con vistas diferenciadas por rol.

## Tareas

- [x] 1. Actualizar configuración de base de datos y variables de entorno
  - Cambiar el valor por defecto de `DB_NAME` en `solarium-api/src/db/pool.ts` de `SalonBelleza` a `DB_TiendaBelleza`
  - Actualizar `solarium-api/.env.example` agregando `JWT_SECRET` y actualizando `DB_NAME=DB_TiendaBelleza`
  - _Requisitos: 1.1, 1.2, 1.5_

- [x] 2. Adaptar endpoint de servicios al esquema DB_TiendaBelleza
  - [x] 2.1 Actualizar `serviciosController.ts` con la query al esquema real
    - Reemplazar la query de `listarServicios` para usar tablas `SERVICIOS` y `CATEGORIAS` en mayúsculas, campo `ESTADO = 1` y alias `duracion_minutos`
    - Actualizar `listarCategorias` para usar tabla `CATEGORIAS` con campo `ESTADO`
    - _Requisitos: 2.1, 2.2, 2.3, 2.4_
  - [x] 2.2 Escribir property test — Propiedad 1: Filtrado de servicios activos
    - **Propiedad 1: Solo registros con ESTADO = 1 son retornados**
    - **Valida: Requisito 2.1**
    - Mock del pool con registros de ESTADO mixto (0 y 1), verificar que la respuesta solo contiene activos
  - [ ]* 2.3 Escribir property test — Propiedad 2: Estructura de respuesta de servicios
    - **Propiedad 2: Cada elemento incluye id_servicio, nombre, descripcion, precio, duracion_minutos y categoria**
    - **Valida: Requisitos 2.2, 2.3**
    - Mock del pool con registros arbitrarios, verificar presencia de todos los campos requeridos

- [x] 3. Checkpoint — Verificar que los tests pasen y el endpoint de servicios funcione
  - Asegurarse de que todos los tests pasen. Consultar al usuario si surgen dudas.

- [x] 4. Implementar tipos e interfaces de autenticación en el backend
  - Agregar a `solarium-api/src/types/index.ts` las interfaces `UsuarioAuth`, `JwtPayload`, `LoginResponse` y `ReservaAdmin` según el diseño
  - Instalar dependencias necesarias: `bcryptjs`, `jsonwebtoken` y sus tipos (`@types/bcryptjs`, `@types/jsonwebtoken`)
  - _Requisitos: 3.3, 3.6, 8.4_

- [x] 5. Implementar authController y ruta de login
  - [x] 5.1 Crear `solarium-api/src/controllers/authController.ts`
    - Implementar handler `login`: validar campos presentes (400), consultar `USUARIOS` JOIN `ROLES` por `USUARIO` y `ESTADO=1`, comparar password con bcrypt, firmar JWT con `id_usuario` y `rol`, retornar `LoginResponse`
    - Leer `JWT_SECRET` exclusivamente desde `process.env.JWT_SECRET` sin valor por defecto
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  - [x] 5.2 Crear `solarium-api/src/routes/auth.ts` y registrar en `app.ts`
    - Definir `POST /api/v1/auth/login` apuntando al handler de `authController`
    - Importar y montar el router en `solarium-api/src/app.ts`
    - _Requisitos: 3.1_
  - [ ]* 5.3 Escribir property test — Propiedad 3: Autenticación solo para usuarios activos
    - **Propiedad 3: Solo usuarios con ESTADO=1 y credenciales correctas reciben 200; el resto recibe 401**
    - **Valida: Requisito 3.2**
    - Mock del pool y bcrypt, generar combinaciones de ESTADO y coincidencia de password
  - [ ]* 5.4 Escribir property test — Propiedad 4: Estructura del JWT emitido
    - **Propiedad 4: El payload del JWT contiene id_usuario y rol; expira en ~8h (±60s)**
    - **Valida: Requisitos 3.3, 3.6**
    - Generar usuarios arbitrarios, verificar payload decodificado y ventana de expiración
  - [ ]* 5.5 Escribir property test — Propiedad 5: Verificación de contraseña con bcrypt
    - **Propiedad 5: Login exitoso con contraseña correcta; 401 con cualquier otra contraseña**
    - **Valida: Requisito 3.8**
    - Generar contraseñas arbitrarias, hashear con bcrypt, verificar comportamiento del login

- [x] 6. Implementar middlewares de autenticación y roles
  - [x] 6.1 Crear `solarium-api/src/middleware/authMiddleware.ts`
    - Extraer token del header `Authorization: Bearer <token>`, retornar 401 si ausente o mal formado
    - Verificar JWT con `JWT_SECRET`, retornar 401 si expirado o firma inválida
    - Adjuntar payload (`id_usuario`, `rol`) al objeto `request`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 6.2 Escribir property test — Propiedad 6: authMiddleware extrae y adjunta payload
    - **Propiedad 6: Para cualquier JWT válido, el middleware adjunta exactamente id_usuario y rol sin modificarlos**
    - **Valida: Requisitos 4.1, 4.4**
    - Generar payloads arbitrarios, firmar JWTs, verificar que req.user coincide exactamente
  - [x] 6.3 Crear `solarium-api/src/middleware/roleMiddleware.ts`
    - Implementar factory `requireRoles(...roles: string[])` que retorna middleware
    - Retornar 403 si el rol del usuario no está en la lista de roles permitidos
    - _Requisitos: 5.1, 5.2_
  - [ ]* 6.4 Escribir property test — Propiedad 7: roleMiddleware permite/deniega según rol
    - **Propiedad 7: Permite acceso si y solo si el rol del usuario está en la lista de roles permitidos**
    - **Valida: Requisitos 5.1, 5.2**
    - Generar combinaciones arbitrarias de rol de usuario y lista de roles permitidos

- [x] 7. Implementar endpoint de reservas admin
  - [x] 7.1 Crear `solarium-api/src/controllers/adminController.ts`
    - Implementar handler `listarReservasHoy`: ejecutar query de reservas del día con JOINs a `CLIENTES`, `SERVICIOS`, `USUARIOS`
    - Retornar arreglo de `ReservaAdmin`; manejar error de BD con 500
    - _Requisitos: 8.3, 8.4_
  - [x] 7.2 Crear `solarium-api/src/routes/admin.ts` y registrar en `app.ts`
    - Definir `GET /api/v1/admin/reservas` protegido con `authMiddleware` y `requireRoles('ADMIN','ESTILISTA','MANICURISTA','RECEPCIONISTA','EMPLEADO')`
    - Importar y montar el router en `solarium-api/src/app.ts`
    - _Requisitos: 5.3, 8.2, 8.3_
  - [ ]* 7.3 Escribir property test — Propiedad 12: Estructura de respuesta de reservas admin
    - **Propiedad 12: Cada elemento incluye id_reserva, cliente, servicio, empleado, fecha_reserva, hora_reserva, estado y observacion**
    - **Valida: Requisito 8.4**
    - Mock del pool con reservas arbitrarias, verificar presencia de todos los campos

- [x] 8. Checkpoint — Verificar que todos los tests del backend pasen
  - Asegurarse de que todos los tests pasen. Consultar al usuario si surgen dudas.

- [x] 9. Implementar tipos y AuthContext en el frontend
  - [x] 9.1 Actualizar `Solarium/src/types/api.ts`
    - Agregar tipos `AuthUser`, `AuthContextValue` y `LoginResponse` según el diseño
    - Actualizar el tipo `Servicio` para incluir `duracion_minutos` (además de `duracion_min` existente o reemplazarlo)
    - _Requisitos: 6.2, 7.5_
  - [x] 9.2 Crear `Solarium/src/context/AuthContext.tsx`
    - Implementar `AuthContext` con React Context API
    - `AuthProvider`: al montar, leer token de `localStorage`, decodificar payload y restaurar estado si es válido
    - Exponer `user`, `login(user: AuthUser)` (guarda en estado y `localStorage`) y `logout()` (limpia estado y `localStorage`)
    - _Requisitos: 6.2, 6.5, 6.6, 6.7, 7.5_
  - [x] 9.3 Crear `Solarium/src/hooks/useAuth.ts`
    - Hook que consume `AuthContext` y retorna su valor
    - _Requisitos: 7.5_
  - [ ]* 9.4 Escribir property test — Propiedad 9: Persistencia del token en localStorage
    - **Propiedad 9: Cualquier token recibido tras login exitoso se almacena en localStorage bajo la clave 'token' sin modificaciones**
    - **Valida: Requisito 6.5**
    - Generar tokens arbitrarios, llamar a `login`, verificar `localStorage.getItem('token')`
  - [ ]* 9.5 Escribir property test — Propiedad 10: Restauración de sesión desde localStorage
    - **Propiedad 10: Al montar AuthProvider con un token válido en localStorage, el estado de autenticación se restaura sin nuevo login**
    - **Valida: Requisito 6.7**
    - Generar tokens JWT válidos, pre-poblar localStorage, montar AuthProvider, verificar estado

- [x] 10. Implementar LoginForm
  - [x] 10.1 Crear `Solarium/src/components/LoginForm.tsx`
    - Campos `usuario` y `password`, botón de envío
    - Deshabilitar botón durante la solicitud HTTP
    - Llamar a `POST /api/v1/auth/login`, en éxito invocar `login()` del AuthContext
    - En error mostrar mensaje recibido sin recargar la página
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 10.2 Escribir property test — Propiedad 8: Botón deshabilitado durante solicitud
    - **Propiedad 8: El botón de envío está deshabilitado durante toda la solicitud HTTP y se habilita al completar**
    - **Valida: Requisito 6.3**
    - Mock de fetch con delay arbitrario, verificar estado del botón antes y después de la respuesta

- [x] 11. Implementar PanelAdmin
  - [x] 11.1 Crear `Solarium/src/components/PanelAdmin.tsx`
    - Mostrar nombre y rol del usuario autenticado en encabezado
    - Al montar, llamar a `GET /api/v1/admin/reservas` con token en header `Authorization: Bearer <token>`
    - Renderizar lista de reservas del día con todos los campos de `ReservaAdmin`
    - Si la llamada falla con 401, invocar `logout()` del AuthContext
    - _Requisitos: 8.1, 8.2, 8.5, 8.6_

- [x] 12. Implementar VistaReserva
  - [x] 12.1 Crear `Solarium/src/components/VistaReserva.tsx`
    - Campos: selector de servicio (poblado desde `GET /api/v1/servicios`), fecha, hora y observación
    - Al enviar, llamar a `POST /api/v1/reservas` con los datos del formulario
    - En éxito mostrar mensaje de confirmación con número de reserva; en error mostrar mensaje sin recargar
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 13. Actualizar App.tsx y Navbar con enrutamiento condicional por rol
  - [x] 13.1 Actualizar `Solarium/src/App.tsx`
    - Envolver la aplicación en `AuthProvider`
    - Renderizar condicionalmente: `PanelAdmin` si `Rol_Administrativo`, `VistaReserva` si `Rol_Cliente`, página pública si no autenticado
    - _Requisitos: 7.1, 7.2, 7.3, 7.4_
  - [ ]* 13.2 Escribir property test — Propiedad 11: Enrutamiento condicional por rol
    - **Propiedad 11: Rol_Administrativo renderiza PanelAdmin; Rol_Cliente renderiza VistaReserva; no autenticado renderiza página pública**
    - **Valida: Requisitos 7.1, 7.2**
    - Generar usuarios con roles arbitrarios, montar App con AuthProvider mockeado, verificar render
  - [x] 13.3 Actualizar `Solarium/src/components/Navbar.tsx`
    - Agregar botón "Iniciar sesión" cuando no hay usuario autenticado (abre LoginForm)
    - Agregar botón "Cerrar sesión" cuando hay usuario autenticado (invoca `logout()`)
    - _Requisitos: 6.6, 7.3_

- [x] 14. Checkpoint final — Verificar que todos los tests pasen
  - Asegurarse de que todos los tests del backend y frontend pasen. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los property tests usan **fast-check** en el backend y **@fast-check/vitest** + **vitest** en el frontend
- Las queries al backend usan parámetros con `.input(...)` de mssql para prevenir SQL injection
- `JWT_SECRET` nunca tiene valor por defecto en código; si no está definido el servidor debe fallar al arrancar
