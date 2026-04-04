-- ================================================================
--  PROYECTO FINAL - SISTEMA SALÓN DE BELLEZA
--  SQL Server (T-SQL)
--  Integrantes: CH | P | C | J
--  Estructura: Base de datos + 4 áreas con CRUD, Triggers y SPs
-- ================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SalonBelleza')
    CREATE DATABASE SalonBelleza;
GO

USE SalonBelleza;
GO

-- ================================================================
--  TABLA COMPARTIDA: BITÁCORA
--  Todos los triggers de cada área escriben aquí
-- ================================================================

IF OBJECT_ID('Bitacora', 'U') IS NOT NULL DROP TABLE Bitacora;
GO

CREATE TABLE Bitacora (
    id_bitacora     INT IDENTITY(1,1) PRIMARY KEY,
    tabla_afectada  VARCHAR(100) NOT NULL,
    tipo_operacion  VARCHAR(10)  NOT NULL
                        CONSTRAINT CHK_Bitacora_Tipo
                        CHECK (tipo_operacion IN ('INSERT','UPDATE','DELETE')),
    id_registro     INT          NULL,
    detalle         VARCHAR(MAX) NULL,
    usuario_bd      VARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    fecha_hora      DATETIME     NOT NULL DEFAULT GETDATE()
);
GO


-- ================================================================
--  ÁREA 1 — CH: SERVICIOS & CATEGORÍAS
-- ================================================================

-- ---------------- TABLAS ----------------------------------------

IF OBJECT_ID('Servicio',  'U') IS NOT NULL DROP TABLE Servicio;
IF OBJECT_ID('Categoria', 'U') IS NOT NULL DROP TABLE Categoria;
GO

CREATE TABLE Categoria (
    id_categoria   INT IDENTITY(1,1) PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    descripcion    VARCHAR(255) NULL,
    activo         BIT          NOT NULL DEFAULT 1,
    fecha_creacion DATETIME     NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE Servicio (
    id_servicio    INT IDENTITY(1,1) PRIMARY KEY,
    id_categoria   INT           NOT NULL,
    nombre         VARCHAR(150)  NOT NULL,
    descripcion    VARCHAR(500)  NULL,
    duracion_min   INT           NOT NULL,
    precio         DECIMAL(10,2) NOT NULL,
    activo         BIT           NOT NULL DEFAULT 1,
    fecha_creacion DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Servicio_Categoria FOREIGN KEY (id_categoria)
        REFERENCES Categoria(id_categoria)
);
GO

-- ---------------- TRIGGERS CH -----------------------------------

-- INSERT Categoria
CREATE TRIGGER trg_Categoria_Insert
ON Categoria AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Categoria', 'INSERT', id_categoria,
           'Categoría creada: ' + nombre
    FROM inserted;
END;
GO

-- UPDATE Categoria
CREATE TRIGGER trg_Categoria_Update
ON Categoria AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Categoria', 'UPDATE', i.id_categoria,
           'Categoría modificada: ' + d.nombre + ' → ' + i.nombre
    FROM inserted i JOIN deleted d ON i.id_categoria = d.id_categoria;
END;
GO

-- DELETE Categoria
CREATE TRIGGER trg_Categoria_Delete
ON Categoria AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Categoria', 'DELETE', id_categoria,
           'Categoría eliminada: ' + nombre
    FROM deleted;
END;
GO

-- INSERT Servicio
CREATE TRIGGER trg_Servicio_Insert
ON Servicio AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Servicio', 'INSERT', id_servicio,
           'Servicio creado: ' + nombre + ' | Precio: Bs.' + CAST(precio AS VARCHAR)
    FROM inserted;
END;
GO

-- UPDATE Servicio
CREATE TRIGGER trg_Servicio_Update
ON Servicio AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Servicio', 'UPDATE', i.id_servicio,
           'Servicio modificado: ' + i.nombre +
           ' | Precio: Bs.' + CAST(d.precio AS VARCHAR) + ' → Bs.' + CAST(i.precio AS VARCHAR)
    FROM inserted i JOIN deleted d ON i.id_servicio = d.id_servicio;
END;
GO

-- DELETE Servicio
CREATE TRIGGER trg_Servicio_Delete
ON Servicio AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Servicio', 'DELETE', id_servicio,
           'Servicio eliminado: ' + nombre
    FROM deleted;
END;
GO

-- ---------------- STORED PROCEDURES CH --------------------------

-- SP1: Listar servicios por categoría
CREATE PROCEDURE sp_ListarServiciosPorCategoria
    @id_categoria INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        s.id_servicio,
        s.nombre          AS servicio,
        c.nombre          AS categoria,
        s.duracion_min,
        s.precio,
        s.activo
    FROM Servicio s
    JOIN Categoria c ON s.id_categoria = c.id_categoria
    WHERE s.id_categoria = @id_categoria
    ORDER BY s.nombre;
END;
GO

-- SP2: Actualizar precio de un servicio
CREATE PROCEDURE sp_ActualizarPrecioServicio
    @id_servicio INT,
    @nuevo_precio DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Servicio WHERE id_servicio = @id_servicio)
    BEGIN
        RAISERROR('Servicio no encontrado.', 16, 1);
        RETURN;
    END
    UPDATE Servicio
    SET precio = @nuevo_precio
    WHERE id_servicio = @id_servicio;
    PRINT 'Precio actualizado correctamente.';
END;
GO

-- SP3: Desactivar un servicio
CREATE PROCEDURE sp_DesactivarServicio
    @id_servicio INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Servicio WHERE id_servicio = @id_servicio)
    BEGIN
        RAISERROR('Servicio no encontrado.', 16, 1);
        RETURN;
    END
    UPDATE Servicio SET activo = 0 WHERE id_servicio = @id_servicio;
    PRINT 'Servicio desactivado.';
END;
GO

-- ---------------- DATOS DE PRUEBA CH ----------------------------

INSERT INTO Categoria (nombre, descripcion) VALUES
    ('Cabello',    'Cortes, tintes y tratamientos capilares'),
    ('Uñas',       'Manicure, pedicure y uñas acrílicas'),
    ('Facial',     'Limpiezas, masajes y tratamientos faciales'),
    ('Depilación', 'Depilación con cera o hilo'),
    ('Maquillaje', 'Maquillaje social y de novia');

INSERT INTO Servicio (id_categoria, nombre, duracion_min, precio) VALUES
    (1, 'Corte de cabello',      30,  80.00),
    (1, 'Tinte completo',       120, 350.00),
    (1, 'Tratamiento keratina', 180, 500.00),
    (2, 'Manicure clásico',      45,  60.00),
    (2, 'Uñas acrílicas',        90, 200.00),
    (3, 'Limpieza facial',       60, 150.00),
    (4, 'Depilación de cejas',   15,  40.00),
    (5, 'Maquillaje social',     60, 250.00);
GO


-- ================================================================
--  ÁREA 2 — P: CLIENTES
-- ================================================================

-- ---------------- TABLA -----------------------------------------

IF OBJECT_ID('Cliente', 'U') IS NOT NULL DROP TABLE Cliente;
GO

CREATE TABLE Cliente (
    id_cliente     INT IDENTITY(1,1) PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    apellido       VARCHAR(100) NOT NULL,
    telefono       VARCHAR(20)  NULL,
    email          VARCHAR(150) NULL,
    fecha_registro DATETIME     NOT NULL DEFAULT GETDATE()
);
GO

-- ---------------- TRIGGERS P ------------------------------------

-- INSERT Cliente
CREATE TRIGGER trg_Cliente_Insert
ON Cliente AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Cliente', 'INSERT', id_cliente,
           'Cliente registrado: ' + nombre + ' ' + apellido
    FROM inserted;
END;
GO

-- UPDATE Cliente
CREATE TRIGGER trg_Cliente_Update
ON Cliente AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Cliente', 'UPDATE', i.id_cliente,
           'Cliente modificado: ' + d.nombre + ' ' + d.apellido +
           ' → ' + i.nombre + ' ' + i.apellido +
           ' | Tel: ' + ISNULL(i.telefono, 'sin tel.')
    FROM inserted i JOIN deleted d ON i.id_cliente = d.id_cliente;
END;
GO

-- DELETE Cliente
CREATE TRIGGER trg_Cliente_Delete
ON Cliente AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Cliente', 'DELETE', id_cliente,
           'Cliente eliminado: ' + nombre + ' ' + apellido
    FROM deleted;
END;
GO

-- ---------------- STORED PROCEDURES P ---------------------------

-- SP1: Buscar cliente por nombre o apellido
CREATE PROCEDURE sp_BuscarClientePorNombre
    @texto VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_cliente, nombre, apellido, telefono, email, fecha_registro
    FROM Cliente
    WHERE nombre    LIKE '%' + @texto + '%'
       OR apellido  LIKE '%' + @texto + '%'
    ORDER BY apellido, nombre;
END;
GO

-- SP2: Historial de reservas de un cliente
CREATE PROCEDURE sp_HistorialClienteReservas
    @id_cliente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        t.id_trabajo,
        t.fecha_reserva,
        s.nombre       AS servicio,
        e.nombre + ' ' + e.apellido AS empleado,
        t.estado,
        t.precio_cobrado
    FROM Trabajo t
    JOIN Servicio  s ON t.id_servicio = s.id_servicio
    JOIN Empleado  e ON t.id_empleado = e.id_empleado
    WHERE t.id_cliente = @id_cliente
    ORDER BY t.fecha_reserva DESC;
END;
GO

-- SP3: Eliminar cliente solo si no tiene reservas
CREATE PROCEDURE sp_EliminarClienteSinReservas
    @id_cliente INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Trabajo WHERE id_cliente = @id_cliente)
    BEGIN
        RAISERROR('No se puede eliminar: el cliente tiene reservas registradas.', 16, 1);
        RETURN;
    END
    DELETE FROM Cliente WHERE id_cliente = @id_cliente;
    PRINT 'Cliente eliminado correctamente.';
END;
GO

-- ---------------- DATOS DE PRUEBA P -----------------------------

INSERT INTO Cliente (nombre, apellido, telefono, email) VALUES
    ('Ana',     'Torres',   '70000001', 'ana@email.com'),
    ('Lucía',   'Flores',   '70000002', 'lucia@email.com'),
    ('Patricia','Mamani',   '70000003', 'patricia@email.com'),
    ('Carla',   'Quispe',   '70000004', 'carla@email.com'),
    ('Sofía',   'Condori',  '70000005', 'sofia@email.com');
GO


-- ================================================================
--  ÁREA 3 — C: EMPLEADOS & ESTILISTAS
-- ================================================================

-- ---------------- TABLA -----------------------------------------

IF OBJECT_ID('Empleado', 'U') IS NOT NULL DROP TABLE Empleado;
GO

CREATE TABLE Empleado (
    id_empleado   INT IDENTITY(1,1) PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    apellido      VARCHAR(100) NOT NULL,
    telefono      VARCHAR(20)  NULL,
    email         VARCHAR(150) NULL,
    especialidad  VARCHAR(200) NULL,
    activo        BIT          NOT NULL DEFAULT 1,
    fecha_ingreso DATE         NOT NULL DEFAULT GETDATE()
);
GO

-- ---------------- TRIGGERS C ------------------------------------

-- INSERT Empleado
CREATE TRIGGER trg_Empleado_Insert
ON Empleado AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Empleado', 'INSERT', id_empleado,
           'Empleado registrado: ' + nombre + ' ' + apellido +
           ' | Especialidad: ' + ISNULL(especialidad, 'no especificada')
    FROM inserted;
END;
GO

-- UPDATE Empleado
CREATE TRIGGER trg_Empleado_Update
ON Empleado AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Empleado', 'UPDATE', i.id_empleado,
           'Empleado modificado: ' + i.nombre + ' ' + i.apellido +
           ' | Especialidad: ' + ISNULL(d.especialidad,'—') +
           ' → ' + ISNULL(i.especialidad,'—') +
           ' | Activo: ' + CAST(d.activo AS VARCHAR) + ' → ' + CAST(i.activo AS VARCHAR)
    FROM inserted i JOIN deleted d ON i.id_empleado = d.id_empleado;
END;
GO

-- DELETE Empleado
CREATE TRIGGER trg_Empleado_Delete
ON Empleado AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Empleado', 'DELETE', id_empleado,
           'Empleado eliminado: ' + nombre + ' ' + apellido
    FROM deleted;
END;
GO

-- ---------------- STORED PROCEDURES C ---------------------------

-- SP1: Listar empleados activos
CREATE PROCEDURE sp_ListarEmpleadosActivos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_empleado, nombre, apellido, telefono, especialidad, fecha_ingreso
    FROM Empleado
    WHERE activo = 1
    ORDER BY apellido, nombre;
END;
GO

-- SP2: Buscar empleados por especialidad
CREATE PROCEDURE sp_EmpleadosPorEspecialidad
    @especialidad VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_empleado, nombre, apellido, telefono, email, especialidad
    FROM Empleado
    WHERE especialidad LIKE '%' + @especialidad + '%'
      AND activo = 1
    ORDER BY apellido;
END;
GO

-- SP3: Reporte de trabajos realizados por empleado
CREATE PROCEDURE sp_ReporteTrabajosPorEmpleado
    @id_empleado INT,
    @fecha_inicio DATE = NULL,
    @fecha_fin    DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @fecha_inicio = ISNULL(@fecha_inicio, '2000-01-01');
    SET @fecha_fin    = ISNULL(@fecha_fin,    GETDATE());

    SELECT
        e.nombre + ' ' + e.apellido  AS empleado,
        COUNT(t.id_trabajo)           AS total_trabajos,
        SUM(t.precio_cobrado)         AS total_ingresos,
        MIN(t.fecha_reserva)          AS primer_trabajo,
        MAX(t.fecha_reserva)          AS ultimo_trabajo
    FROM Trabajo t
    JOIN Empleado e ON t.id_empleado = e.id_empleado
    WHERE t.id_empleado = @id_empleado
      AND t.estado       = 'COMPLETADO'
      AND t.fecha_reserva BETWEEN @fecha_inicio AND @fecha_fin
    GROUP BY e.nombre, e.apellido;
END;
GO

-- ---------------- DATOS DE PRUEBA C -----------------------------

INSERT INTO Empleado (nombre, apellido, especialidad) VALUES
    ('María',    'López',     'Colorimetría y tratamientos capilares'),
    ('Sofía',    'Pérez',     'Uñas y estética'),
    ('Valentina','García',    'Cortes y peinados'),
    ('Camila',   'Rodríguez', 'Maquillaje y cuidado facial');
GO


-- ================================================================
--  ÁREA 4 — J: RESERVAS & TRABAJOS
-- ================================================================

-- ---------------- TABLA -----------------------------------------

IF OBJECT_ID('Trabajo', 'U') IS NOT NULL DROP TABLE Trabajo;
GO

CREATE TABLE Trabajo (
    id_trabajo     INT IDENTITY(1,1) PRIMARY KEY,
    id_cliente     INT           NOT NULL,
    id_empleado    INT           NOT NULL,
    id_servicio    INT           NOT NULL,
    fecha_reserva  DATETIME      NOT NULL,
    fecha_registro DATETIME      NOT NULL DEFAULT GETDATE(),
    estado         VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE'
                       CONSTRAINT CHK_Trabajo_Estado
                       CHECK (estado IN ('PENDIENTE','CONFIRMADO','EN_PROCESO','COMPLETADO','CANCELADO')),
    precio_cobrado DECIMAL(10,2) NULL,
    observaciones  VARCHAR(500)  NULL,
    CONSTRAINT FK_Trabajo_Cliente  FOREIGN KEY (id_cliente)  REFERENCES Cliente(id_cliente),
    CONSTRAINT FK_Trabajo_Empleado FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado),
    CONSTRAINT FK_Trabajo_Servicio FOREIGN KEY (id_servicio) REFERENCES Servicio(id_servicio)
);
GO

-- ---------------- TRIGGERS J ------------------------------------

-- INSERT Trabajo
CREATE TRIGGER trg_Trabajo_Insert
ON Trabajo AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Trabajo', 'INSERT', id_trabajo,
           'Reserva creada | Cliente: ' + CAST(id_cliente AS VARCHAR) +
           ' | Empleado: '  + CAST(id_empleado AS VARCHAR) +
           ' | Servicio: '  + CAST(id_servicio AS VARCHAR) +
           ' | Fecha: '     + CONVERT(VARCHAR, fecha_reserva, 120) +
           ' | Estado: '    + estado
    FROM inserted;
END;
GO

-- UPDATE Trabajo
CREATE TRIGGER trg_Trabajo_Update
ON Trabajo AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Trabajo', 'UPDATE', i.id_trabajo,
           'Reserva modificada | Estado: ' + d.estado + ' → ' + i.estado +
           ' | Precio: Bs.' + CAST(ISNULL(d.precio_cobrado,0) AS VARCHAR) +
           ' → Bs.' + CAST(ISNULL(i.precio_cobrado,0) AS VARCHAR)
    FROM inserted i JOIN deleted d ON i.id_trabajo = d.id_trabajo;
END;
GO

-- DELETE Trabajo
CREATE TRIGGER trg_Trabajo_Delete
ON Trabajo AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (tabla_afectada, tipo_operacion, id_registro, detalle)
    SELECT 'Trabajo', 'DELETE', id_trabajo,
           'Reserva eliminada | Cliente: ' + CAST(id_cliente AS VARCHAR) +
           ' | Fecha era: ' + CONVERT(VARCHAR, fecha_reserva, 120)
    FROM deleted;
END;
GO

-- ---------------- STORED PROCEDURES J ---------------------------

-- SP1: Crear una nueva reserva
CREATE PROCEDURE sp_CrearReserva
    @id_cliente    INT,
    @id_empleado   INT,
    @id_servicio   INT,
    @fecha_reserva DATETIME,
    @observaciones VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @precio DECIMAL(10,2);

    IF NOT EXISTS (SELECT 1 FROM Cliente  WHERE id_cliente  = @id_cliente)
    BEGIN RAISERROR('Cliente no encontrado.',  16, 1); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM Empleado WHERE id_empleado = @id_empleado)
    BEGIN RAISERROR('Empleado no encontrado.', 16, 1); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM Servicio WHERE id_servicio = @id_servicio AND activo = 1)
    BEGIN RAISERROR('Servicio no disponible.', 16, 1); RETURN; END

    SELECT @precio = precio FROM Servicio WHERE id_servicio = @id_servicio;

    INSERT INTO Trabajo (id_cliente, id_empleado, id_servicio, fecha_reserva, precio_cobrado, observaciones)
    VALUES (@id_cliente, @id_empleado, @id_servicio, @fecha_reserva, @precio, @observaciones);

    PRINT 'Reserva creada con ID: ' + CAST(SCOPE_IDENTITY() AS VARCHAR);
END;
GO

-- SP2: Cambiar estado de una reserva
CREATE PROCEDURE sp_CambiarEstadoReserva
    @id_trabajo INT,
    @nuevo_estado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF @nuevo_estado NOT IN ('PENDIENTE','CONFIRMADO','EN_PROCESO','COMPLETADO','CANCELADO')
    BEGIN
        RAISERROR('Estado no válido. Use: PENDIENTE, CONFIRMADO, EN_PROCESO, COMPLETADO, CANCELADO', 16, 1);
        RETURN;
    END
    IF NOT EXISTS (SELECT 1 FROM Trabajo WHERE id_trabajo = @id_trabajo)
    BEGIN RAISERROR('Reserva no encontrada.', 16, 1); RETURN; END

    UPDATE Trabajo SET estado = @nuevo_estado WHERE id_trabajo = @id_trabajo;
    PRINT 'Estado actualizado a: ' + @nuevo_estado;
END;
GO

-- SP3: Consultar reservas por rango de fechas
CREATE PROCEDURE sp_ReservasPorFecha
    @fecha_inicio DATE,
    @fecha_fin    DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        t.id_trabajo,
        c.nombre + ' ' + c.apellido  AS cliente,
        e.nombre + ' ' + e.apellido  AS empleado,
        s.nombre                      AS servicio,
        t.fecha_reserva,
        t.estado,
        t.precio_cobrado
    FROM Trabajo t
    JOIN Cliente  c ON t.id_cliente  = c.id_cliente
    JOIN Empleado e ON t.id_empleado = e.id_empleado
    JOIN Servicio s ON t.id_servicio = s.id_servicio
    WHERE CAST(t.fecha_reserva AS DATE) BETWEEN @fecha_inicio AND @fecha_fin
    ORDER BY t.fecha_reserva;
END;
GO

-- ---------------- DATOS DE PRUEBA J -----------------------------

EXEC sp_CrearReserva 1, 1, 2, '2025-07-10 09:00', 'Cliente frecuente';
EXEC sp_CrearReserva 2, 2, 4, '2025-07-10 10:00', NULL;
EXEC sp_CrearReserva 3, 3, 1, '2025-07-11 11:00', NULL;
EXEC sp_CrearReserva 4, 4, 8, '2025-07-12 14:00', 'Primera vez';
EXEC sp_CrearReserva 1, 1, 3, '2025-07-13 09:00', NULL;

EXEC sp_CambiarEstadoReserva 1, 'COMPLETADO';
EXEC sp_CambiarEstadoReserva 2, 'COMPLETADO';
EXEC sp_CambiarEstadoReserva 3, 'EN_PROCESO';
EXEC sp_CambiarEstadoReserva 4, 'CANCELADO';
GO


-- ================================================================
--  VISTAS DEL DASHBOARD DE BITÁCORA (compartido)
-- ================================================================

-- KPIs generales: total INSERT / UPDATE / DELETE
CREATE VIEW vw_Dashboard_Totales AS
SELECT
    COUNT(*)                                                    AS total_general,
    SUM(CASE WHEN tipo_operacion = 'INSERT' THEN 1 ELSE 0 END) AS total_insert,
    SUM(CASE WHEN tipo_operacion = 'UPDATE' THEN 1 ELSE 0 END) AS total_update,
    SUM(CASE WHEN tipo_operacion = 'DELETE' THEN 1 ELSE 0 END) AS total_delete
FROM Bitacora;
GO

-- Desglose por tabla y tipo de operación
CREATE VIEW vw_Dashboard_PorTabla AS
SELECT
    tabla_afectada,
    tipo_operacion,
    COUNT(*)         AS total,
    MAX(fecha_hora)  AS ultima_vez
FROM Bitacora
GROUP BY tabla_afectada, tipo_operacion;
GO

-- Actividad diaria (para gráfico de barras)
CREATE VIEW vw_Dashboard_PorDia AS
SELECT
    CAST(fecha_hora AS DATE)                                        AS fecha,
    SUM(CASE WHEN tipo_operacion = 'INSERT' THEN 1 ELSE 0 END)     AS inserts,
    SUM(CASE WHEN tipo_operacion = 'UPDATE' THEN 1 ELSE 0 END)     AS updates,
    SUM(CASE WHEN tipo_operacion = 'DELETE' THEN 1 ELSE 0 END)     AS deletes,
    COUNT(*)                                                        AS total
FROM Bitacora
GROUP BY CAST(fecha_hora AS DATE);
GO

-- Últimas 50 operaciones
CREATE VIEW vw_Dashboard_LogReciente AS
SELECT TOP 50
    id_bitacora,
    tabla_afectada,
    tipo_operacion,
    id_registro,
    detalle,
    usuario_bd,
    fecha_hora
FROM Bitacora
ORDER BY fecha_hora DESC;
GO


-- ================================================================
--  CONSULTAS DE PRUEBA FINALES
-- ================================================================

-- Dashboard: KPIs
SELECT * FROM vw_Dashboard_Totales;

-- Dashboard: por tabla
SELECT * FROM vw_Dashboard_PorTabla ORDER BY tabla_afectada, tipo_operacion;

-- Dashboard: por día
SELECT * FROM vw_Dashboard_PorDia ORDER BY fecha;

-- Dashboard: log reciente
SELECT * FROM vw_Dashboard_LogReciente;

-- Probar SPs de CH
EXEC sp_ListarServiciosPorCategoria 1;
EXEC sp_ActualizarPrecioServicio 1, 90.00;

-- Probar SPs de P
EXEC sp_BuscarClientePorNombre 'Ana';
EXEC sp_HistorialClienteReservas 1;

-- Probar SPs de C
EXEC sp_ListarEmpleadosActivos;
EXEC sp_EmpleadosPorEspecialidad 'Uñas';
EXEC sp_ReporteTrabajosPorEmpleado 1, '2025-01-01', '2025-12-31';

-- Probar SPs de J
EXEC sp_ReservasPorFecha '2025-07-01', '2025-07-31';
GO
