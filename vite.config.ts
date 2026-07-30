import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "unplugin-dts/vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import autoprefixer from "autoprefixer";

const packageName = "packageName";

export default defineConfig({
  plugins: [
    cssInjectedByJsPlugin(),
    dts({
      exclude: ["src/example.ts"],
      entryRoot: "src",
      outDirs: ["dist"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: packageName,
      fileName: "index",
      formats: ["es", "cjs"],
    },
  },
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
});
