import { defineConfig } from 'vite';
import { resolve } from 'path';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  // prevent vite from obscuring rust errors
  clearScreen: false,
  server: {
    port: 1420,
    // Tauri expects a fixed port, fail if that port is not available
    strictPort: true,
    // if the host Tauri is expecting is set, use it
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,

    watch: {
      // tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  // Env variables starting with the item of `envPrefix` will be exposed in tauri's source code through `import.meta.env`.
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target:
      process.env.TAURI_ENV_PLATFORM == 'windows'
        ? 'chrome105'
        : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,

    // tell vite where to look for the html files
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/ui/index.html'),
        fs: resolve(__dirname, 'src/ui/fs.html'),
        page1: resolve(__dirname, 'src/ui/page1.html'),
        page2: resolve(__dirname, 'src/ui/page2.html'),
        page3: resolve(__dirname, 'src/ui/page3.html'),
        page4: resolve(__dirname, 'src/ui/page4.html'),
      }
    }
  },
});