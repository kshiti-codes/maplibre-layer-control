import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MapLibreLayerControl',
      fileName: 'maplibre-layer-control',
    },
    rollupOptions: {
      external: ['vue', 'maplibre-gl'],
      output: {
        globals: {
          vue: 'Vue',
          'maplibre-gl': 'maplibregl',
        },
      },
    },
  },
});