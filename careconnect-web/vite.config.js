import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // Relative base: one dist/ works at any path, at a host's root or under the
  // GitHub Pages project path /swen661-devintel/. With the default "/", the built
  // page asks for /assets/… at the host root, gets 404s and paints nothing.
  // This is safe because routing is hash-based: every view is index.html.
  base: "./",
  plugins: [react()],
});
