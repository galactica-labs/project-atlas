import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const workspaceRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Force a single React instance across all packages (prevents R3F "invalid hook" error in monorepos)
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@atlas/api-types": path.resolve(workspaceRoot, "packages/api-types/src/index.ts"),
      "@atlas/api-client": path.resolve(workspaceRoot, "packages/api-client/src/index.ts"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: ["atlas.vardalas.com", ".vardalas.com", "localhost"],
    proxy: {
      "/api": {
        target: "http://localhost:3123",
        changeOrigin: true,
      },
    },
  },
});
