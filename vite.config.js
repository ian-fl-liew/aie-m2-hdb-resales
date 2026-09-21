import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Vitest runs component tests in a simulated DOM
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
  },
});
