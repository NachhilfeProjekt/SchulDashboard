// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Plugin zum Kopieren oder Erstellen der staticsitesettings.json
const copyStaticSiteSettings = () => {
  return {
    name: 'copy-static-site-settings',
    closeBundle() {
      // Pfade zu Quell- und Zieldatei
      const sourcePath = './staticsitesettings.json';
      const targetPath = './build/staticsitesettings.json';
      
      // Zielverzeichnis erstellen, falls es nicht existiert
      if (!fs.existsSync('./build')) {
        fs.mkdirSync('./build', { recursive: true });
      }
      
      try {
        if (fs.existsSync(sourcePath)) {
          // Kopiere vorhandene Datei
          fs.copyFileSync(sourcePath, targetPath);
          console.log('staticsitesettings.json copied to build/');
        } else {
          // Erstelle Standarddatei
          const defaultSettings = {
            routes: [
              {
                route: "/*",
                serve: "/index.html",
                status: 200
              }
            ]
          };
          
          fs.writeFileSync(targetPath, JSON.stringify(defaultSettings, null, 2));
          console.log('Default staticsitesettings.json created in build/');
        }
      } catch (error) {
        console.error('Error handling staticsitesettings.json:', error);
        // Fehler nicht weitergeben, um den Build nicht zu unterbrechen
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
  // Proxy-Konfiguration (für Entwicklung)
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
