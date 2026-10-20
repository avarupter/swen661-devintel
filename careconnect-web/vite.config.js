import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    css: false,
    restoreMocks: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
      reportsDirectory: "./coverage",

      // Everything shipped to the browser counts, including the bootstrap.
      // `all: true` is the important half: without it a file with no test file
      // of its own is simply absent from the report rather than counted at 0%,
      // which makes a coverage number meaningless as a completeness signal.
      all: true,
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/test/**"],

      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
