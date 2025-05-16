// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Plugin zum Kopieren der staticsitesettings.json
const copyStaticSiteSettings = () => {
  return {
    name: 'copy-static-site-settings',
    closeBundle() {
      if (fs.existsSync('./staticsitesettings.json')) {
        fs.copyFileSync('./staticsitesettings.json', './dist/staticsitesettings.json');
        console.log('staticsitesettings.json copied to dist/');
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
  base: '/', // Wichtig für korrektes URL-Routing
  build: {
    outDir: 'dist',
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
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-redux', '@mui/material'],
  },
});
