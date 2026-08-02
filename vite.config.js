import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Rollup tự detect shared modules và split chunks theo dynamic import
    chunkSizeWarningLimit: 1000, // Warn if chunk > 1MB
    sourcemap: false, // Disable sourcemaps in production for smaller builds
    minify: 'esbuild', // Use esbuild (built-in, faster than terser)
  },
  server: {
    host: "0.0.0.0", // mở cho LAN
    port: 3001, // giữ nguyên cổng bạn đang dùng
  },
});
