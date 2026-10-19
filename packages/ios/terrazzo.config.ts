import { fileURLToPath } from "node:url";
import { defineConfig } from "@terrazzo/cli";
import { files, loadResolver, RESOLVER } from "../../tokens/source.ts";
import ios from "./plugin-ios.ts";

// The semantic colors (ADR 0064), in the order the files define them. iOS follows the theme only: density, shape, and
// viewport are fixed (ADR 0063), and the system does the rest.
const resolver = await loadResolver();
const tokens = resolver.apply({});
export const colors = [...new Set(files(resolver).filter((f) => f.tier === "semantic").flatMap((f) => Object.keys(f.tokens)))].filter(
  (id) => tokens[id]?.$type === "color",
);
export const fixed = { density: "relaxed", shape: "round", viewport: "narrow" };

export default defineConfig({
  tokens: [fileURLToPath(RESOLVER)],
  outDir: "./dist/",
  plugins: [ios({ colors, fixed })],
});
