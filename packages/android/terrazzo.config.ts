import { fileURLToPath } from "node:url";
import { defineConfig } from "@terrazzo/cli";
import { files, loadResolver, RESOLVER } from "../../tokens/source.ts";
import { families } from "./fonts.ts";
import compose, { type Group } from "./plugin-compose.ts";

// The semantic tokens (ADR 0056, 0059): what product code uses, in the order the files define them, one class per
// modifier that changes them. Primitives stay reference for defining tokens; component tokens follow when a Compose
// component needs them; motion, elevation, z-index, and breakpoints wait for a use on Android.
const resolver = await loadResolver();
const tokens = resolver.apply({});
const semantic = [...new Set(files(resolver).filter((f) => f.tier === "semantic").flatMap((f) => Object.keys(f.tokens)))];
const pick = (type: string, groups: string[]) => semantic.filter((id) => tokens[id]?.$type === type && groups.includes(id.split(".")[0]));

export const groups: Group[] = [
  {
    filename: "PtsColors.kt",
    className: "PtsColors",
    include: semantic.filter((id) => tokens[id]?.$type === "color"),
    modifier: "theme",
    kind: "color",
    doc: "The semantic colors of Plain.",
  },
  {
    filename: "PtsSpacing.kt",
    className: "PtsSpacing",
    include: pick("dimension", ["space", "padding", "gap", "size"]),
    modifier: "density",
    kind: "dp",
    doc: "The spacing of Plain: the space scale, padding, gaps, and icon and control sizes.",
  },
  {
    filename: "PtsBorder.kt",
    className: "PtsBorder",
    include: pick("dimension", ["radius", "stroke", "focus-ring"]),
    modifier: "shape",
    kind: "dp",
    doc: "The corners and strokes of Plain: radius, stroke widths, and the focus ring.",
  },
  {
    filename: "PtsTypography.kt",
    className: "PtsTypography",
    include: pick("typography", ["text"]),
    modifier: "viewport",
    kind: "textStyle",
    dropPrefix: "text.",
    doc: "The text styles of Plain. Narrow is a phone; wide starts at breakpoint/md (768dp), a tablet.",
  },
];

export default defineConfig({
  tokens: [fileURLToPath(RESOLVER)],
  outDir: "./dist/",
  plugins: [compose({ packageName: "io.github.haaanju.pts", groups, families })],
});
