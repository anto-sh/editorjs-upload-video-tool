import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "unplugin-dts/vite";

const packageName = "packageName";

export default defineConfig({
  plugins: [
    dts({
      outDirs: [
        "dist", // default .d.ts
        { dir: "dist/cjs", moduleFormat: "cjs" }, // .d.cts
        { dir: "dist/esm", moduleFormat: "esm" }, // .d.mts
      ],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: packageName,
      fileName: "index",
      formats: ["es", "cjs"],
    },
  },
});
