import { fileURLToPath } from "node:url";
import { defineConfig } from "@terrazzo/cli";
import { files, loadResolver, RESOLVER } from "../../tokens/source.ts";
import compose from "./plugin-compose.ts";

// The semantic colors (ADR 0056): what product code uses, in the order the files define them. Primitives stay
// reference for defining tokens; component tokens follow when a Compose component needs them.
const resolver = await loadResolver();
const colors = resolver.apply({});
const include = [...new Set(files(resolver).filter((f) => f.tier === "semantic").flatMap((f) => Object.keys(f.tokens)))].filter(
  (id) => colors[id]?.$type === "color",
);

export default defineConfig({
  tokens: [fileURLToPath(RESOLVER)],
  outDir: "./dist/",
  plugins: [compose({ filename: "PtsColors.kt", packageName: "io.github.haaanju.pts", className: "PtsColors", include, modifier: "theme" })],
});
