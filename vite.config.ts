/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // You'll also need this for React

export default defineConfig({
  plugins: [react()], // Add the react plugin
  base: "./",
  esbuild: {
    supported: {
      "top-level-await": true,
    },
  },

  // --- !! ADD THIS ENTIRE 'server' BLOCK !! ---
  server: {
    proxy: {
      // Rule 1: Proxies /api/bim/... requests
      '/api/bim': {
        target: 'http://localhost:8080', // Your API backend
        changeOrigin: true,
        // Rewrite the path:
        // /api/bim/getAllProjects -> http://localhost:8080/cdeDataManager/api/bim/getAllProjects
        rewrite: (path) => path.replace(/^\/api\/bim/, '/cdeDataManager/api/bim'),
      }

      // // Rule 2: Proxies /api/convert-ifc
      // '/api/convert-ifc': {
      //   target: 'http://localhost:3000', // Adjust port if this runs elsewhere
      //   changeOrigin: true,
      //   // No rewrite needed if the path is identical
      // },
      //
      // // Rule 3: Proxies /api/message
      // '/api/message': {
      //   target: 'http://localhost:3000', // Adjust port if this runs elsewhere
      //   changeOrigin: true,
      //   // No rewrite needed if the path is identical

    },
  },
});