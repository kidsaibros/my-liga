import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Komponent testlari DOM talab qiladi; sof funksiya testlari ham jsdom'da muammosiz ishlaydi.
    environment: "jsdom",
    globals: false,
    include: ["lib/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}", "components/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
