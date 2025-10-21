// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        principal: '#8c000f',
        secundario: '#f83258',
        terciario: '#f6dae7',
      },
      screens: {
        'xs': '475px',    // Móviles pequeños
        'sm': '640px',    // Móviles grandes
        'md': '768px',    // Tablets
        'lg': '1024px',   // Laptops
        'xl': '1280px',   // Desktop
        '2xl': '1536px',  // Pantallas grandes
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          md: '2rem',
          lg: '2.5rem',
          xl: '3rem',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  // ...resto de la config...
}

