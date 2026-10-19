import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@terrazzo/cli";
import { files, loadResolver, RESOLVER } from "../../tokens/source.ts";
import ios, { type Release } from "./plugin-ios.ts";

// The semantic colors (ADR 0064), in the order the files define them. iOS follows the theme only: density, shape, and
// viewport are fixed (ADR 0063), and the system does the rest.
const resolver = await loadResolver();
const tokens = resolver.apply({});
export const colors = [...new Set(files(resolver).filter((f) => f.tier === "semantic").flatMap((f) => Object.keys(f.tokens)))].filter(
  (id) => tokens[id]?.$type === "color",
);
export const fixed = { density: "relaxed", shape: "round", viewport: "narrow" };

// What's new on the demo's Home screen, as on Android (ADR 0061): this version's entries in the shared changelog, so
// they never go stale, and the date of its tag, when the tag is here (a shallow checkout has none)
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const version: string = JSON.parse(read("package.json")).version;
const section = read("../web/CHANGELOG.md").match(new RegExp(`^## ${version.replaceAll(".", "\\.")}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"))?.[1] ?? "";
const date = (() => {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", `v${version}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null;
  } catch {
    return null;
  }
})();
export const release: Release = { version, date, notes: section.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2)) };

export default defineConfig({
  tokens: [fileURLToPath(RESOLVER)],
  outDir: "./dist/",
  plugins: [ios({ colors, fixed, catalog: release })],
});
