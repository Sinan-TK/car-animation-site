import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function copyFrames() {
  return {
    name: "copy-frames",
    closeBundle() {
      const source = resolve("frames");
      const destination = resolve("dist", "frames");

      if (existsSync(source)) {
        cpSync(source, destination, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyFrames()],
  base: "/scroll-web/",
});
