import { defineConfig } from "vitest/config";
import path from "node:path";

const projectRoot = import.meta.dirname;

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: { "@": path.resolve(projectRoot), "server-only": path.resolve(projectRoot, "tests/server-only.ts") },
  },
});
