import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/auth": {
        // Use IPv4 explicitly: the Spring Boot process listens on IPv4 and
        // `localhost` can resolve to IPv6 first on Windows, causing proxy timeouts.
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/users": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/promotions": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/services": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
    },
    fs: {
      allow: ["./client", "./shared", "index.html"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));
