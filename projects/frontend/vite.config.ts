import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const workspaceRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@atlas/api-types": path.resolve(workspaceRoot, "packages/api-types/src/index.ts"),
      "@atlas/api-client": path.resolve(workspaceRoot, "packages/api-client/src/index.ts"),
    },
  },
  server: {
    host: "localhost",
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
