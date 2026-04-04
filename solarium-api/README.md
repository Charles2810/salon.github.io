# solarium-api

API REST para el salón de belleza Solarium. Construida con Node.js, Express y TypeScript; conecta con la base de datos SQL Server `SalonBelleza`.

## Requisitos previos

- Node.js 20+
- SQL Server con la base de datos `SalonBelleza` configurada

## Instalación

```bash
cd solarium-api
npm install
```

## Configuración

Copia el archivo de ejemplo y completa tus credenciales:

```bash
cp .env.example .env
```

Variables disponibles en `.env`:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host del servidor SQL Server | `localhost` |
| `DB_PORT` | Puerto de SQL Server | `1433` |
| `DB_NAME` | Nombre de la base de datos | `SalonBelleza` |
| `DB_USER` | Usuario de SQL Server | `sa` |
| `DB_PASSWORD` | Contraseña del usuario | — |
| `PORT` | Puerto en que escucha la API | `3001` |
| `CORS_ORIGIN` | Origen permitido por CORS | `http://localhost:5173` |

## Ejecución

### Desarrollo (con recarga automática)

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

## Endpoints

Todos los endpoints están bajo el prefijo `/api/v1`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/servicios` | Lista servicios activos |
| GET | `/api/v1/servicios/categoria/:id` | Servicios por categoría |
| GET | `/api/v1/categorias` | Lista categorías activas |
| GET | `/api/v1/empleados` | Empleados activos |
| POST | `/api/v1/reservas` | Crear reserva |
| PATCH | `/api/v1/reservas/:id/estado` | Cambiar estado de reserva |
| GET | `/api/v1/reservas` | Reservas por rango de fechas |
| GET | `/api/v1/clientes/buscar` | Buscar cliente por nombre |

## Estructura del proyecto

```
solarium-api/
├── src/
│   ├── db/
│   │   └── pool.ts          # Pool de conexiones mssql
│   ├── routes/
│   │   ├── servicios.ts
│   │   ├── empleados.ts
│   │   ├── reservas.ts
│   │   └── clientes.ts
│   ├── controllers/
│   │   ├── serviciosController.ts
│   │   ├── empleadosController.ts
│   │   ├── reservasController.ts
│   │   └── clientesController.ts
│   ├── types/
│   │   └── index.ts
│   ├── app.ts
│   └── index.ts
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```
