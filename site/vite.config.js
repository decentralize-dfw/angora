// The presentation site is hand-authored HTML and CSS in ../en/; only the
// scripts are bundled, so three.js ships from this repository rather than a
// CDN. Output names are stable (no hashes): GitHub Pages caches briefly and
// stable names keep the published diff readable.
import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
  root: here('./'),
  base: './',
  publicDir: false,
  build: {
    outDir: here('../en/site-assets/'),
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: here('./src/main.js'),
      output: {
        entryFileNames: 'site.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
