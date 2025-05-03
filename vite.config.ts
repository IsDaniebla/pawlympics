import { defineConfig } from 'vite'

export default defineConfig({
  base: '/pawlympics/', // Ajusta esto al nombre de tu repositorio
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Habilitamos sourcemaps para debug
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
}) 