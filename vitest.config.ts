import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // Adicionamos 'as any' para ignorar o conflito de versões entre as pastas
  plugins: [react() as any], 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});