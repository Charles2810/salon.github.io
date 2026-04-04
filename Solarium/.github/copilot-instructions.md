<!-- Use this file to provide workspace-specific custom instructions to Copilot. -->

## SOLARIUM - Beauty Salon React Application

This is a fully functional React + Vite + Tailwind CSS web application for SOLARIUM beauty salon.

### Project Status
✅ Project successfully scaffolded and configured
✅ All components created and styled
✅ Responsive design implemented
✅ Development server running on http://localhost:5173

### Technology Stack
- React 18 with TypeScript
- Vite 5 (Fast build tool)
- Tailwind CSS 4 (Utility-first CSS)
- PostCSS configuration
- HMR (Hot Module Reload) enabled

### Project Structure
```
src/
├── App.tsx          # Main component with complete beauty salon website
├── App.css          # Component-specific styles
├── index.css        # Global styles with Tailwind directives
├── main.tsx         # React entry point
└── vite-env.d.ts    # TypeScript definitions
```

### Available Commands
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Key Features Implemented
1. **Navigation** - Sticky header with smooth scrolling links
2. **Hero Section** - Welcoming banner with CTA button
3. **Services** - 6 beauty services with prices and descriptions
4. **Testimonials** - Customer reviews with star ratings
5. **Booking Form** - Complete appointment scheduling form with validation
6. **Contact Info** - Location, phone, and business hours
7. **Responsive Layout** - Optimized for all screen sizes
8. **Modern Design** - Gradient backgrounds and smooth animations

### Customization Guide
- **Add Services**: Edit the `services` array in App.tsx
- **Add Testimonials**: Edit the `testimonials` array in App.tsx
- **Update Contact**: Modify the Contact Section in App.tsx
- **Change Colors**: Edit tailwind.config.js theme colors
- **Backend Integration**: Modify `handleSubmit` function to send form data

### Development Tips
- Tailwind CSS classes are used throughout for styling
- Form state is managed with React hooks
- All components are in a single App.tsx file for simplicity
- Responsive design uses Tailwind's built-in breakpoints (md:)
- TypeScript types are included for form data

### Production Build
- Run `npm run build` to create optimized production bundle
- Output files in `/dist` folder ready for deployment
