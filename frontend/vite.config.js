// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// Kopieren von staticsitesettings.json in das Ausgabeverzeichnis
const copyStaticSiteSettings = () => {
  return {
    name: 'copy-static-site-settings',
    generateBundle() {
      const settingsPath = path.resolve(__dirname, 'staticsitesettings.json');
      if (fs.existsSync(settingsPath)) {
        const settingsContent = fs.readFileSync(settingsPath, 'utf8');
        this.emitFile({
          type: 'asset',
          fileName: 'staticsitesettings.json',
          source: settingsContent
        });
      }
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    copyStaticSiteSettings()
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    historyApiFallback: true
  },
  base: '/'
});
