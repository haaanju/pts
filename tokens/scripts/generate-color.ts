// Generates the color tokens:
//   src/primitive/color.tokens.json          palette
//   src/semantic/color.tokens.json           theme-independent colors (always/*)
//   src/semantic/color.{light,dark}.tokens.json
//
// Names and pairing rules: ADR 0017. Which fills get hover/pressed: ADR 0018.
//
// Palette: Figma anchor values (the original exploration file) plus in-between steps as OKLab
// midpoints. Semantic: fixed choices for surfaces, plus steps picked as the nearest step to a
// preferred one that satisfies the WCAG constraints enforced by check.ts.
//
// Run: npm run generate:color -w @pts/tokens   (then npm run check)
// Output is deterministic; running it on an unchanged source produces no diff.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "../src");

// ---------- color math ----------

type RGB = [number, number, number];
const hexToRgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
const rgbToHex = (c: number[]) => "#" + c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("");
const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

const rgbToOklab = (rgb: RGB): RGB => {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const oklabToRgb = ([L, a, b]: RGB): RGB => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(toGamma) as RGB;
};
/** OKLab interpolation between two hex colors */
const mix = (from: string, to: string, t: number) => {
  const [a, b] = [rgbToOklab(hexToRgb(from)), rgbToOklab(hexToRgb(to))];
  return rgbToHex(oklabToRgb(a.map((v, i) => v + (b[i] - v) * t) as RGB));
};

const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ---------- palette ----------

// Anchors from the Figma exploration file. Hue anchors map Highlight → 100, High → 300,
// Normal → 500, Medium → 700, Low → 900 (see ADR 0005).
const NEUTRAL_ANCHORS: Record<string, string> = {
  50: "#f8f8f8", 100: "#f2f2f2", 200: "#e8e8e8", 300: "#d7d7d7", 400: "#bababa", 500: "#9e9e9e",
  600: "#808080", 700: "#666666", 800: "#404040", 900: "#242424", 950: "#181818", 1000: "#060606",
};
const HUE_ANCHORS: Record<string, [string, string, string, string, string]> = {
  red: ["#fdeaeb", "#f2838a", "#e9313c", "#8c1d24", "#460f12"],
  orange: ["#fff3e6", "#ffd099", "#ff8a00", "#995301", "#4c2900"],
  green: ["#e6f7ea", "#99dfab", "#00af2c", "#01691a", "#00340d"],
  blue: ["#e5f3ff", "#a5d2f8", "#2e82e8", "#0b4785", "#052a52"],
  purple: ["#f0e8ff", "#cf95f5", "#7a2cdb", "#380b75", "#1f0540"],
};
const ALPHAS = [5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90];

type ColorValue = { colorSpace: "srgb"; components: number[]; alpha?: number; hex: string };
const colorToken = (hex: string, alpha?: number) => {
  const components = hexToRgb(hex).map((v) => Math.round(v * 10000) / 10000);
  // key order (colorSpace, components, alpha, hex) is kept stable so regenerating produces no diff
  const value: ColorValue = alpha === undefined ? { colorSpace: "srgb", components, hex } : { colorSpace: "srgb", components, alpha, hex };
  return { $type: "color", $value: value };
};

const neutral: Record<string, string> = {};
for (const [step, hex] of Object.entries(NEUTRAL_ANCHORS)) {
  if (step === "900") neutral["850"] = mix(NEUTRAL_ANCHORS[800], NEUTRAL_ANCHORS[900], 0.5); // dark hover step (ADR 0015)
  neutral[step] = hex;
}

const hues: Record<string, Record<string, string>> = {};
for (const [hue, [s100, s300, s500, s700, s900]] of Object.entries(HUE_ANCHORS)) {
  hues[hue] = {
    50: mix("#ffffff", s100, 0.5),
    100: s100, 200: mix(s100, s300, 0.5), 300: s300, 400: mix(s300, s500, 0.5),
    500: s500, 600: mix(s500, s700, 0.5), 700: s700, 800: mix(s700, s900, 0.5), 900: s900,
  };
}

const HUE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const NEUTRAL_STEPS = Object.keys(neutral).map(Number);
const hexOf = (ref: string) => {
  if (ref === "white") return "#ffffff";
  if (ref === "black") return "#000000";
  const [hue, step] = ref.split(".");
  return hue === "neutral" ? neutral[step] : hues[hue][step];
};

// JSON keys: numeric-looking keys are ordered by JS, which matches the step order here.
const orderedGroup = (steps: Record<string, string>) => Object.fromEntries(Object.entries(steps).map(([k, hex]) => [k, colorToken(hex)]));
const palette = {
  color: {
    white: colorToken("#ffffff"),
    black: colorToken("#000000"),
    neutral: orderedGroup(neutral),
    ...Object.fromEntries(Object.entries(hues).map(([hue, steps]) => [hue, orderedGroup(steps)])),
    "black-alpha": Object.fromEntries(ALPHAS.map((a) => [a, colorToken("#000000", a / 100)])),
  },
};

// ---------- semantic ----------

const TEXT = 4.5; // WCAG 1.4.3
const UI = 3; // WCAG 1.4.11
const ROLES = { danger: "red", warning: "orange", success: "green", info: "blue", discovery: "purple" } as const;
// Intents whose emphasis fill is pressable (destructive buttons), so it gets hover/pressed (ADR 0018).
const PRESSABLE = new Set(["danger"]);
type Mode = "light" | "dark";

/** Steps ordered by distance from `prefer`; ties go to the lighter step. */
const nearest = (steps: number[], prefer: number) => {
  const i0 = steps.indexOf(prefer);
  return steps
    .map((s, i) => ({ s, d: Math.abs(i - i0), after: i > i0 }))
    .sort((a, b) => a.d - b.d || Number(a.after) - Number(b.after))
    .map((x) => x.s);
};
const pick = (hue: string, steps: number[], prefer: number, ok: (hex: string) => boolean) => {
  for (const s of nearest(steps, prefer)) if (ok(hexOf(`${hue}.${s}`))) return `${hue}.${s}`;
  throw new Error(`No ${hue} step near ${prefer} satisfies the constraints`);
};
/** Base, hover, pressed as consecutive steps in `dir` that carry one on-color and stay visible on the page. */
const pickSolid = (hue: string, steps: number[], prefer: number, dir: 1 | -1, pageOk: (hex: string) => boolean) => {
  for (const s of nearest(steps, prefer)) {
    const i = steps.indexOf(s);
    const trio = [i, i + dir, i + 2 * dir].map((j) => steps[j]);
    if (trio.some((x) => x === undefined)) continue;
    const hexes = trio.map((x) => hexOf(`${hue}.${x}`));
    if (!hexes.every(pageOk)) continue;
    for (const [on, onHex] of [["black", "#000000"], ["white", "#ffffff"]] as const) {
      if (hexes.every((h) => contrast(h, onHex) >= TEXT)) return { states: trio.map((x) => `${hue}.${x}`), on };
    }
  }
  throw new Error(`No ${hue} solid trio near ${prefer}`);
};

const semantic = (mode: Mode) => {
  const dark = mode === "dark";
  const dir = dark ? -1 : 1; // light gets darker on interaction, dark gets lighter
  const bg: Record<string, string> = {};
  const content: Record<string, string> = {};
  const border: Record<string, string> = {};

  // Canvas, surfaces, and the transparent-element states are fixed choices; check.ts verifies they stay distinct.
  bg.canvas = dark ? "neutral.950" : "white";
  bg.hover = dark ? "neutral.850" : "neutral.100";
  bg.pressed = dark ? "neutral.800" : "neutral.200";
  bg.disabled = dark ? "neutral.900" : "neutral.50"; // exempt from contrast (inactive)
  const surface = { subtle: dark ? "neutral.900" : "neutral.50", raised: dark ? "neutral.900" : "white" };

  const pages = [bg.canvas, bg.hover, bg.pressed, ...Object.values(surface)].map(hexOf);
  const onPages = (min: number) => (hex: string) => pages.every((p) => contrast(hex, p) >= min);

  // inverse: the flipped fill for primary buttons, tooltips, and snackbars
  const inv = pickSolid("neutral", NEUTRAL_STEPS, dark ? 50 : 950, dir, onPages(UI));
  const inverse = { base: inv.states[0], hover: inv.states[1], pressed: inv.states[2] };
  const onInverse = (hex: string) => inv.states.every((s) => contrast(hex, hexOf(s)) >= TEXT);

  content.base = pick("neutral", NEUTRAL_STEPS, dark ? 50 : 950, onPages(TEXT));
  content.muted = pick("neutral", NEUTRAL_STEPS, dark ? 500 : 700, onPages(TEXT));
  content.disabled = dark ? "neutral.600" : "neutral.400"; // exempt
  const contentInverse = { base: inv.on, muted: pick("neutral", NEUTRAL_STEPS, dark ? 700 : 500, onInverse) };

  border.base = pick("neutral", NEUTRAL_STEPS, dark ? 600 : 500, onPages(UI));
  border.subtle = dark ? "neutral.800" : "neutral.200"; // decorative divider, exempt from 1.4.11
  border.focus = pick("neutral", NEUTRAL_STEPS, dark ? 50 : 950, onPages(UI));
  border.disabled = dark ? "neutral.800" : "neutral.200"; // exempt

  const intent: Record<string, { background: Record<string, string>; content: Record<string, string>; border: Record<string, string> }> = {};
  for (const [role, hue] of Object.entries(ROLES)) {
    // Picked as a hover/pressed trio even when only the base is emitted, so adding states later doesn't move it.
    const emphasis = pickSolid(hue, HUE_STEPS, 500, dir, onPages(UI));
    const subtle = dark ? `${hue}.900` : `${hue}.100`;
    const states: Record<string, string> = PRESSABLE.has(role) ? { hover: emphasis.states[1], pressed: emphasis.states[2] } : {};
    intent[role] = {
      background: { emphasis: emphasis.states[0], subtle, ...states },
      content: {
        base: pick(hue, HUE_STEPS, dark ? 300 : 700, onPages(TEXT)),
        emphasis: emphasis.on,
        subtle: pick(hue, HUE_STEPS, dark ? 200 : 800, (h) => contrast(h, hexOf(subtle)) >= TEXT),
      },
      border: {
        base: pick(hue, HUE_STEPS, dark ? 400 : 600, onPages(UI)),
        subtle: dark ? `${hue}.700` : `${hue}.300`, // decorative, exempt
      },
    };
  }

  // Refs become aliases; nested objects stay groups.
  type Tree = { [key: string]: string | Tree };
  const tokens = (tree: Tree): Record<string, unknown> =>
    Object.fromEntries(Object.entries(tree).map(([k, v]) => [k, typeof v === "string" ? alias(v) : tokens(v)]));
  return tokens({
    background: { ...bg, surface, inverse },
    content: { ...content, inverse: contentInverse },
    border,
    utility: { scrim: dark ? "black-alpha.70" : "black-alpha.50" }, // translucent, exempt
    intent,
  });
};

const alias = (ref: string) => ({ $type: "color", $value: `{color.${ref}}` });
// Same in every theme, so they live in the base set (ADR 0017).
const always = { always: { white: alias("white"), black: alias("black") } };

// ---------- write ----------

const write = (file: string, data: unknown) => writeFileSync(join(SRC, file), JSON.stringify(data, null, 2) + "\n");
write("primitive/color.tokens.json", palette);
write("semantic/color.tokens.json", always);
for (const mode of ["light", "dark"] as const) write(`semantic/color.${mode}.tokens.json`, semantic(mode));
console.log("✔ color tokens generated (primitive color, semantic color, color.light, color.dark)");
