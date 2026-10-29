import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@terrazzo/cli";
import { files, loadResolver, RESOLVER } from "../../tokens/source.ts";
import summary, { count, counted, type Entry } from "../../tokens/summary.ts";
import ios, { type DimensionGroup, type Release } from "./plugin-ios.ts";

// The semantic colors (ADR 0064), text styles (ADR 0066), borders (ADR 0067), and spacing (ADR 0068), in file order. iOS follows the theme
// only: density, shape, and viewport are fixed (ADR 0063), and the system does the rest.
const resolver = await loadResolver();
const tokens = resolver.apply({});
const semantic = [...new Set(files(resolver).filter((f) => f.tier === "semantic").flatMap((f) => Object.keys(f.tokens)))];
export const colors = semantic.filter((id) => tokens[id]?.$type === "color");
// Increase Contrast (ADR 0071): a color takes the next step of its own ladder, one further from the background
// (content/subtle → content/base, surface/subtle → surface/strong, inverse/base → inverse/strong), so each pair it forms
// is one pts/contrast already checks. An intent's surface/subtle stays: its content/base is checked on it alone.
// disabled, utility, and always are outside the pairs; the strongest step of each ladder has nothing further.
const STEPS = ["subtle", "base", "strong", "stronger"];
export const contrast: Record<string, string> = Object.fromEntries(
  colors.flatMap((id) => {
    if (/^(disabled|utility|always)\./.test(id) || /^intent\.[\w-]+\.surface\.subtle$/.test(id)) return [];
    const parts = id.split(".");
    const step = STEPS.indexOf(parts.at(-1)!);
    if (step < 0) return [];
    const next = STEPS.slice(step + 1).map((s) => [...parts.slice(0, -1), s].join(".")).find((n) => colors.includes(n));
    return next ? [[id, next]] : [];
  }),
);
// The component colors (ADR 0078): native controls draw the rest of a component, so only its colors reach iOS
export const componentColors = [...new Set(files(resolver).filter((f) => f.tier === "component").flatMap((f) => Object.keys(f.tokens)))].filter(
  (id) => tokens[id]?.$type === "color",
);
const pick = (groups: string[]) => semantic.filter((id) => tokens[id]?.$type === "dimension" && groups.includes(id.split(".")[0]));
export const dimensions: DimensionGroup[] = [
  {
    className: "PtsSpacing",
    include: pick(["space", "padding", "gap", "size"]),
    doc: "The spacing of Plain, in points, at density relaxed: the space scale, padding, gaps, and icon and control sizes.",
  },
  { className: "PtsBorder", include: pick(["radius", "stroke", "focus-ring"]), doc: "The corners and strokes of Plain, in points, at shape round: radius, stroke widths, and the focus ring." },
];
export const text = semantic.filter((id) => id.startsWith("text.") && tokens[id]?.$type === "typography");
export const fixed = { density: "relaxed", shape: "round", viewport: "narrow" };
// The family each font stack starts with → the family its bundled file registers (build-fonts.ts writes the files)
export const families = { Aspekta: "Aspekta Variable", "IBM Plex Mono": "IBM Plex Mono", "IBM Plex Serif": "IBM Plex Serif" };
export const key = "io.github.haaanju.pts";

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
  plugins: [
    ios({ colors, contrast, componentColors, dimensions, text, families, key, fixed, catalog: release }),
    // What the build wrote (ADR 0074): the color sets, then each Swift file with its token count; build-fonts.ts adds
    // the fonts
    summary(new URL("./", import.meta.url), (files) => {
      const counts = {
        PtsColors: colors.length,
        PtsComponentColors: componentColors.length,
        PtsTypography: text.length,
        PtsFonts: new Set(Object.values(families)).size,
        ...Object.fromEntries(dimensions.map((d) => [d.className, d.include.length])),
      };
      const sets = files.filter((f) => f.endsWith(".colorset/Contents.json")).length;
      const high = Object.keys(contrast).length + componentColors.filter((id) => tokens[id]?.aliasChain?.[0]! in contrast).length;
      const swift = (dir: string) => files.filter((f) => f.startsWith(dir) && f.endsWith(".swift"));
      return [
        ["Pts/", [["Colors.xcassets", `${count(sets)} color sets, ${count(high)} with Increase Contrast`], ...counted(swift("Pts/"), counts)]],
        ["catalog/", counted(swift("catalog/"), {}).map((name): Entry => [String(name), "demo app only"])],
      ];
    }),
  ],
});
