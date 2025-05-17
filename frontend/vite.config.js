// frontend/vite.config.js
import { defineConfig } from 'vite';  // Diese Zeile fehlte
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Plugin zum Kopieren der staticsitesettings.json
const copyStaticSiteSettings = () => {
  return {
    name: 'copy-static-site-settings',
    closeBundle() {
      if (fs.existsSync('./staticsitesettings.json')) {
        fs.copyFileSync('./staticsitesettings.json', './build/staticsitesettings.json');
        console.log('staticsitesettings.json copied to build/');
      } else {
        console.warn('staticsitesettings.json not found!');
      }
    }
  };
};

export default defineConfig({
  plugins: [react(), copyStaticSiteSettings()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  // Proxy-Konfiguration
  server: {
    proxy: {
      '/api': {
        target: 'https://dashboard-backend-uweg.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-redux', '@mui/material'],
  },
});
