import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteObfuscateFile } from 'vite-plugin-obfuscator';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteObfuscateFile({
      include: ['src/**/*.js', 'src/**/*.jsx'],
      apply: 'build',
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.2,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.5,
        renameGlobals: false,
        selfDefending: true,
        identifierNamesGenerator: 'hexadecimal',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: false },
      mangle: { toplevel: true },
    },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash][extname]',
        manualChunks: (id) => {
          if (id.includes('node_modules')) return 'v';
          if (id.includes('/engine/')) return 'e';
          if (id.includes('/pages/')) return 'p';
          if (id.includes('/components/')) return 'c';
        },
      },
    },
  },
  define: {
    // Make process.env available for compatibility
    'process.env': {},
  },
});
