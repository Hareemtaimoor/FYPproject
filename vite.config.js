import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  /** Where IIS / API lives (same host you use in Postman, without path). */
  const proxyTarget = (env.VITE_PROXY_TARGET || "http://192.168.0.44").replace(/\/$/, "");

  return {
    plugins: [react()],
    server: {
      // Browser calls same-origin /FYP2/api/... → Vite forwards to your API (avoids CORS in dev).
      proxy: {
        "/FYP2/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
