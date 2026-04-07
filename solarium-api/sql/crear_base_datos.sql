


CREATE DATABASE DB_TiendaBelleza;
GO

USE DB_TiendaBelleza;
GO

CREATE TABLE ROLES (
    ID_ROL      INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE      VARCHAR(50)  NOT NULL UNIQUE,
    DESCRIPCION VARCHAR(255) NULL,
    ESTADO      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    CHECK (ESTADO IN ('ACTIVO', 'INACTIVO'))
);
GO

CREATE TABLE CATEGORIAS (
    ID_CATEGORIA  INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE        VARCHAR(100) NOT NULL,
    DESCRIPCION   VARCHAR(255) NULL,
    ESTADO        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    CHECK (ESTADO IN ('ACTIVO', 'INACTIVO'))
);
GO

CREATE TABLE SERVICIOS (
    ID_SERVICIO      INT IDENTITY(1,1) PRIMARY KEY,
    ID_CATEGORIA     INT           NOT NULL,
    NOMBRE           VARCHAR(100)  NOT NULL,
    DESCRIPCION      VARCHAR(255)  NULL,
    PRECIO           DECIMAL(10,2) NOT NULL,
    DURACION_MINUTOS INT           NULL,
    ESTADO           VARCHAR(20)   NOT NULL DEFAULT 'ACTIVO',
    CHECK (PRECIO >= 0),
    CHECK (ESTADO IN ('ACTIVO', 'INACTIVO')),
    FOREIGN KEY (ID_CATEGORIA) REFERENCES CATEGORIAS(ID_CATEGORIA)
);
GO

CREATE TABLE CLIENTES (
    ID_CLIENTE  INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE      VARCHAR(100) NOT NULL,
    APELLIDO    VARCHAR(100) NOT NULL,
    TELEFONO    VARCHAR(20)  NULL,
    CORREO      VARCHAR(100) NULL,
    DIRECCION   VARCHAR(200) NULL
);
GO

CREATE TABLE USUARIOS (
    ID_USUARIO    INT IDENTITY(1,1) PRIMARY KEY,
    ID_ROL        INT          NOT NULL,
    NOMBRE        VARCHAR(100) NOT NULL,
    APELLIDO      VARCHAR(100) NOT NULL,
    TELEFONO      VARCHAR(20)  NULL,
    CORREO        VARCHAR(100) NULL,
    USUARIO       VARCHAR(50)  NOT NULL UNIQUE,
    PASSWORD      VARCHAR(255) NOT NULL,
    ESPECIALIDAD  VARCHAR(200) NULL,
    ESTADO        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    FECHA_INGRESO DATE         NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ID_ROL) REFERENCES ROLES(ID_ROL),
    CHECK (ESTADO IN ('ACTIVO', 'INACTIVO'))
);
GO

CREATE TABLE RESERVAS (
    ID_RESERVA    INT IDENTITY(1,1) PRIMARY KEY,
    ID_CLIENTE    INT          NOT NULL,
    ID_SERVICIO   INT          NOT NULL,
    ID_USUARIO    INT          NOT NULL,
    FECHA_RESERVA DATE         NOT NULL,
    HORA_RESERVA  TIME         NOT NULL,
    ESTADO        VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    OBSERVACION   VARCHAR(255) NULL,
    FOREIGN KEY (ID_CLIENTE)  REFERENCES CLIENTES(ID_CLIENTE),
    FOREIGN KEY (ID_SERVICIO) REFERENCES SERVICIOS(ID_SERVICIO),
    FOREIGN KEY (ID_USUARIO)  REFERENCES USUARIOS(ID_USUARIO),
    CHECK (ESTADO IN ('PENDIENTE', 'CONFIRMADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO'))
);
GO

CREATE TABLE TRABAJOS (
    ID_TRABAJO     INT IDENTITY(1,1) PRIMARY KEY,
    ID_RESERVA     INT           NOT NULL,
    ID_USUARIO     INT           NOT NULL,
    ID_SERVICIO    INT           NOT NULL,
    FECHA_TRABAJO  DATETIME      NOT NULL DEFAULT GETDATE(),
    DURACION_REAL  INT           NULL,
    PRECIO_COBRADO DECIMAL(10,2) NOT NULL DEFAULT 0,
    OBSERVACION    VARCHAR(255)  NULL,
    ESTADO         VARCHAR(20)   NOT NULL DEFAULT 'COMPLETADO',
    FOREIGN KEY (ID_RESERVA)  REFERENCES RESERVAS(ID_RESERVA),
    FOREIGN KEY (ID_USUARIO)  REFERENCES USUARIOS(ID_USUARIO),
    FOREIGN KEY (ID_SERVICIO) REFERENCES SERVICIOS(ID_SERVICIO),
    CHECK (ESTADO IN ('COMPLETADO', 'INCOMPLETO', 'ANULADO'))
);
GO

CREATE TABLE PAGOS (
    ID_PAGO     INT IDENTITY(1,1) PRIMARY KEY,
    ID_TRABAJO  INT           NOT NULL,
    FECHA_PAGO  DATETIME      NOT NULL DEFAULT GETDATE(),
    MONTO       DECIMAL(10,2) NOT NULL,
    METODO_PAGO VARCHAR(30)   NOT NULL,
    ESTADO      VARCHAR(20)   NOT NULL DEFAULT 'PAGADO',
    OBSERVACION VARCHAR(255)  NULL,
    FOREIGN KEY (ID_TRABAJO) REFERENCES TRABAJOS(ID_TRABAJO),
    CHECK (MONTO >= 0),
    CHECK (METODO_PAGO IN ('EFECTIVO', 'QR', 'TARJETA', 'TRANSFERENCIA')),
    CHECK (ESTADO IN ('PAGADO', 'PENDIENTE', 'ANULADO'))
);
GO

CREATE TABLE BITACORA (
    ID_BITACORA     INT IDENTITY(1,1) PRIMARY KEY,
    TABLA           VARCHAR(50)  NOT NULL,
    ACCION          VARCHAR(20)  NOT NULL,
    DESCRIPCION     VARCHAR(255) NOT NULL,
    USUARIO_SISTEMA VARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    FECHA           DATETIME     NOT NULL DEFAULT GETDATE(),
    CHECK (ACCION IN ('INSERT', 'UPDATE', 'DELETE'))
);
GO

-- Roles
INSERT INTO ROLES (NOMBRE, DESCRIPCION) VALUES
('ADMIN',         'Administrador del sistema, acceso total'),
('ESTILISTA',     'Especialista en cabello y peinados'),
('MANICURISTA',   'Especialista en uñas y manos'),
('RECEPCIONISTA', 'Gestión de citas y atención al cliente'),
('EMPLEADO',      'Personal general del salón');
GO

-- Categorías
INSERT INTO CATEGORIAS (NOMBRE, DESCRIPCION) VALUES
('Cabello',    'Cortes, tintes, peinados y tratamientos'),
('Uñas',       'Manicura, pedicura y uñas acrílicas'),
('Facial',     'Limpiezas y tratamientos faciales'),
('Depilación', 'Depilación con cera o hilo'),
('Maquillaje', 'Maquillaje social y de novia');
GO

-- Servicios
INSERT INTO SERVICIOS (ID_CATEGORIA, NOMBRE, DESCRIPCION, PRECIO, DURACION_MINUTOS, ESTADO) VALUES
(1, 'Corte de cabello',     'Corte personalizado',          90.00,  30,  'ACTIVO'),
(1, 'Tinte completo',       'Coloración completa',         350.00, 120,  'ACTIVO'),
(1, 'Tratamiento keratina', 'Alisado con keratina',        500.00, 180,  'ACTIVO'),
(2, 'Manicure clásico',     'Limpieza y esmaltado',         60.00,  45,  'ACTIVO'),
(2, 'Uñas acrílicas',       'Extensión de uñas acrílicas', 200.00,  90,  'ACTIVO'),
(3, 'Limpieza facial',      'Limpieza profunda',           150.00,  60,  'ACTIVO'),
(4, 'Depilación de cejas',  'Diseño y depilación',          40.00,  15,  'ACTIVO'),
(5, 'Maquillaje social',    'Maquillaje para eventos',     250.00,  60,  'ACTIVO');
GO

-- Usuarios (contraseña: "password" — hash bcrypt rounds=10)
-- Para cambiar la contraseña, generar nuevo hash con bcrypt y reemplazar el valor
INSERT INTO USUARIOS (ID_ROL, NOMBRE, APELLIDO, TELEFONO, CORREO, USUARIO, PASSWORD, ESPECIALIDAD, ESTADO) VALUES
(1, 'Carlos',  'Admin',    '60011111', 'admin@solarium.com',   'admin',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL,      'ACTIVO'),
(2, 'Sofia',   'Estilista','60022222', 'sofia@solarium.com',   'sofia',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cabello', 'ACTIVO'),
(3, 'Valeria', 'Manicure', '60033333', 'valeria@solarium.com', 'valeria', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Uñas',   'ACTIVO'),
(4, 'Roberto', 'Recep',    '60044444', 'roberto@solarium.com', 'roberto', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL,      'ACTIVO');
GO

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'solarium_user')
    CREATE LOGIN solarium_user WITH PASSWORD = 'Solarium2024!';
GO

CREATE USER solarium_user FOR LOGIN solarium_user;
ALTER ROLE db_owner ADD MEMBER solarium_user;
GO


