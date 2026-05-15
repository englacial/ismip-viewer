import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Library build: produces a single ES module bundle that exports mount() /
// unmount(). All deps (React, deck.gl, zarrita, icechunk-js, etc.) are
// bundled in so the consumer drops one file and is done.
//
// SPA build (vite.config.ts) is unchanged — englacial.org/static/models/
// keeps working standalone.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist-lib",
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/lib.tsx"),
      formats: ["es"],
      fileName: () => "ismip6-viewer.js",
    },
    rollupOptions: {
      // Intentionally NO `external` — bundle everything in. Consumers get a
      // single self-contained file. If bundle size becomes a problem later
      // we can externalize react/react-dom and ship them via import map.
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  optimizeDeps: {
    include: ["@deck.gl/core", "@deck.gl/layers", "@deck.gl/react"],
  },
});
