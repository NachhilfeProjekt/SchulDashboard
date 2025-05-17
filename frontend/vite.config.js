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
  // Fügen Sie die Proxy-Konfiguration hinzu
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
