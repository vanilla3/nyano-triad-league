import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// NOTE: allow importing JSON from monorepo root (rulesets/ and test-vectors/)
const monorepoRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src"), "@root": monorepoRoot },
  },
  server: {
    fs: {
      allow: [monorepoRoot],
    },
  },
  test: {
    globals: true,
    environment: "node",
    exclude: ["e2e/**", "node_modules/**"],
  },
});
