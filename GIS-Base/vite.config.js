import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'MGOS_');
  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: ['Workers', 'Assets', 'Widgets', 'ThirdParty'].map((folder) => ({
          src: `node_modules/cesium/Build/Cesium/${folder}/**/*`,
          dest: `cesium/${folder}`,
        })),
      }),
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.MGOS_API_PROXY_TARGET || 'http://127.0.0.1:3000', changeOrigin: true },
        '/geoserver': { target: env.MGOS_GEOSERVER_PROXY_TARGET || 'http://127.0.0.1:8080', changeOrigin: true },
      },
    },
    // Cesium is isolated behind the lazy /scene route. Keep a tight ceiling
    // around its measured production size so unexpected growth still warns.
    build: { chunkSizeWarningLimit: 4300 },
  };
});
