# SOLARIUM - Salón de Belleza Web

Una aplicación web moderna para un salón de belleza creada con React, Vite y Tailwind CSS.

## 🌟 Características

- **Navigation Menu** - Navegación rápida a las diferentes secciones
- **Hero Section** - Bienvenida impactante al salón
- **Servicios** - Catálogo completo de servicios con precios
  - Corte de Cabello
  - Coloración
  - Alisado Brasileño
  - Tratamiento Capilar
  - Manicura
  - Pedicura
- **Testimonios** - Reviews de clientes satisfechos
- **Formulario de Reserva** - Agendar citas online
- **Información de Contacto** - Ubicación, teléfono y horarios
- **Diseño Responsivo** - Optimizado para todos los dispositivos

## 🛠️ Tecnologías

- **React 18** - Librería de UI moderna
- **Vite 5** - Build tool rápido y eficiente
- **Tailwind CSS 4** - Framework de CSS utilitario
- **TypeScript** - Tipado estático para JavaScript
- **PostCSS** - Herramienta de transformación de CSS

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Preview de build de producción
npm run preview
```

## 🚀 Uso

El proyecto está configurado para ejecutarse localmente en `http://localhost:5173/`

### Comandos disponibles:

- `npm run dev` - Inicia el servidor de desarrollo con HMR (Hot Module Reload)
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Vista previa del build de producción localmente
- `npm run lint` - Ejecuta el linter ESLint

## 📁 Estructura del Proyecto

```
solarium/
├── src/
│   ├── App.tsx          # Componente principal con toda la página
│   ├── App.css          # Estilos específicos de App
│   ├── index.css        # Estilos globales y directivas Tailwind
│   ├── main.tsx         # Punto de entrada de React
│   └── vite-env.d.ts    # Tipos de TypeScript para Vite
├── public/              # Archivos estáticos
├── dist/                # Build de producción (generado)
├── tailwind.config.js   # Configuración de Tailwind CSS
├── postcss.config.js    # Configuración de PostCSS
├── vite.config.ts       # Configuración de Vite
└── package.json         # Dependencias y scripts
```

## 🎨 Personalización

### Colores
Los colores del tema se pueden personalizar editando `tailwind.config.js` en la sección `theme > extend > colors`.

### Servicios
Para añadir o modificar servicios, edita el array `services` en el componente `App.tsx`.

### Testimonios
Para añadir o modificar testimonios, edita el array `testimonials` en el componente `App.tsx`.

### Información de Contacto
Actualiza los datos de contacto en la sección "Contact Section" del componente `App.tsx`.

## 🔑 Variables de Formulario

El formulario de reserva captura:
- Nombre
- Email
- Teléfono
- Servicio
- Fecha
- Hora

Actualmente muestra una alerta al enviar. Para integrar con un backend, modifica la función `handleSubmit`.

## 📱 Responsive Design

La aplicación utiliza Tailwind CSS para un diseño completamente responsivo:
- Navegación adaptable (oculta en móvil)
- Grillas que se adaptan según el tamaño de pantalla
- Textos y espaciados optimizados para cada dispositivo

## 🚀 Despliegue

Para desplegar la aplicación:

1. Ejecuta `npm run build` para crear la versión de producción
2. El archivo `dist/index.html` es el entrada a tu sitio
3. Sube los archivos de `dist/` a tu servidor web

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y comercial.

## 👨‍💻 Desarrollo

Para empezar a desarrollar:

1. Abre VS Code en la carpeta del proyecto
2. Ejecuta `npm install` para instalar dependencias
3. Ejecuta `npm run dev` para iniciar el servidor
4. Abre `http://localhost:5173/` en tu navegador
5. Los cambios se reflejan automáticamente (HMR)

---

**SOLARIUM** - Tu lugar favorito para belleza y bienestar ☀️
