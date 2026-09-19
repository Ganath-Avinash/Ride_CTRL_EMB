import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'oxc',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react';
            if (id.includes('firebase'))       return 'vendor-firebase';
            if (id.includes('leaflet'))        return 'vendor-leaflet';
            if (id.includes('recharts'))       return 'vendor-recharts';
            if (id.includes('/ogl/'))          return 'vendor-ogl';
            if (id.includes('/gsap/'))         return 'vendor-gsap';
            if (id.includes('lucide-react'))   return 'vendor-lucide';
          }
        },
      },
    },
    // Raise chunk warning threshold for named vendor chunks
    chunkSizeWarningLimit: 600,
  },
})
