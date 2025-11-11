/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  esbuild: {
    supported: {
      "top-level-await": true,
    },
  },

  server: {
    proxy: {
      // Rule 1: Proxies /api/bim/... requests
      '/api/bim': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bim/, '/cdeDataManager/api/bim'),
      },

      // Rule 2: Proxy IFC file downloads through backend
      '/api/proxy-ifc': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy-ifc/, '/cdeDataManager/api/bim/proxyIfc'),
      },

      // Remove /api/message since it's not working
    },
  },
});