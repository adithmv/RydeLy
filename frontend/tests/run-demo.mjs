import { build } from "vite";

const result = await build({
  configFile: false,
  logLevel: "error",
  build: {
    write: false,
    target: "esnext",
    minify: false,
    lib: { entry: "tests/demo.test.ts", formats: ["es"] },
    rollupOptions: { external: ["node:assert/strict"] },
  },
});
const output = (Array.isArray(result) ? result[0] : result).output.find(
  (item) => item.type === "chunk",
);
await import(
  `data:text/javascript;base64,${Buffer.from(output.code).toString("base64")}`
);
