import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "inkguide-sync",
    entrypoint: "./src/index.js",
    compatibilityDate: "2026-09-01",
    domains: ["sync.inkguide.uk"],
    env: {
      DB: bindings.d1({ name: "inkguide-sync" }),
    },
  },
});
