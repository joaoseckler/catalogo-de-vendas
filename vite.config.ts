import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import site from "./src/data/site.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: site.basePath ? `/${site.basePath}/` : undefined,
});
