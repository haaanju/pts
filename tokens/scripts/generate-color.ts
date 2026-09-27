// Generates the color tokens:
//   src/primitive/color.tokens.json          palette
//   src/semantic/color.tokens.json           theme-independent colors (always/*)
//   src/semantic/color.{light,dark}.tokens.json
//
// Names, pairing rules, and descriptions: ADR 0019.
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
// Per-intent wording for the descriptions: what its buttons are called and an example of its text.
const ROLE_WORDS: Record<keyof typeof ROLES, { button: string; text: string; border: string }> = {
  danger: { button: "destructive buttons", text: "error messages", border: ", such as an input with an error" },
  warning: { button: "warning buttons", text: "caution messages", border: "" },
  success: { button: "success buttons", text: "confirmation messages", border: "" },
  info: { button: "info buttons", text: "help text", border: "" },
  discovery: { button: "discovery buttons", text: "new-feature labels", border: "" },
};
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

// A token is [palette ref, description]; nested objects are groups.
type Token = [string, string];
type Tree = { [key: string]: Token | Tree };
const EXEMPT = "Exempt from contrast.";
const PAGE_3 = "Meets 3:1 against the background and surfaces.";

const semantic = (mode: Mode) => {
  const dark = mode === "dark";
  const dir = dark ? -1 : 1; // light gets darker away from the background, dark gets lighter

  // The page and the neutral surface ladder are fixed choices; check.ts verifies every step differs.
  const background = dark ? "neutral.950" : "white";
  const surface = { subtle: dark ? "neutral.900" : "neutral.50", strong: dark ? "neutral.850" : "neutral.100", stronger: dark ? "neutral.800" : "neutral.200" };
  const pages = [background, ...Object.values(surface)].map(hexOf);
  const onPages = (min: number) => (hex: string) => pages.every((p) => contrast(hex, p) >= min);

  // inverse: the flipped neutral fill (primary buttons, tooltips, snackbars) with its hover and pressed steps
  const inv = pickSolid("neutral", NEUTRAL_STEPS, dark ? 50 : 950, dir, onPages(UI));
  const onInverse = (hex: string) => inv.states.every((s) => contrast(hex, hexOf(s)) >= TEXT);

  const intent: Tree = {};
  for (const [role, hue] of Object.entries(ROLES) as [keyof typeof ROLES, string][]) {
    const w = ROLE_WORDS[role];
    // base, strong, stronger are picked as one trio that carries the same inverse text.
    const fill = pickSolid(hue, HUE_STEPS, 500, dir, onPages(UI));
    const subtle = dark ? `${hue}.900` : `${hue}.100`;
    const onSubtleAndPages = (h: string) => onPages(TEXT)(h) && contrast(h, hexOf(subtle)) >= TEXT;
    intent[role] = {
      surface: {
        subtle: [subtle, `Soft ${role} fill for alerts, banners, and badges. Use content/base on it.`],
        base: [fill.states[0], `Strong ${role} fill for ${w.button}, badges, and tags. Use content/inverse on it.`],
        strong: [fill.states[1], `Hover fill for ${w.button}. Use content/inverse on it.`],
        stronger: [fill.states[2], `Pressed fill for ${w.button}. Use content/inverse on it.`],
      },
      content: {
        base: [pick(hue, HUE_STEPS, dark ? 300 : 700, onSubtleAndPages), `${role[0].toUpperCase()}${role.slice(1)} text and icons on the background, surfaces, and the ${role} surface/subtle, such as ${w.text}.`],
        inverse: [fill.on, `Text and icons on the ${role} surface/base, strong, and stronger.`],
      },
      border: {
        base: [pick(hue, HUE_STEPS, dark ? 400 : 600, onPages(UI)), `Boundary in the ${role} color${w.border}. ${PAGE_3}`],
        subtle: [dark ? `${hue}.700` : `${hue}.300`, `Decorative outline around the ${role} surface/subtle. ${EXEMPT}`],
      },
    };
  }

  return tokens({
    background: [background, "Page background. The bottom layer that everything else sits on. Inside a surface, also the inset fill for code blocks and neutral badges."],
    surface: {
      subtle: [surface.subtle, "Cards, popovers, and modals, and tinted areas on the background: code blocks, neutral badges, progress tracks, sidebars. One step from the background in both themes."],
      strong: [surface.strong, "Hover fill for list items, ghost buttons, and other transparent elements, on the background or a surface."],
      stronger: [surface.stronger, "Pressed fill for list items, ghost buttons, and other transparent elements, on the background or a surface."],
    },
    inverse: {
      base: [inv.states[0], "Flipped fill for primary buttons, tooltips, and snackbars. Use content/inverse/* on it."],
      strong: [inv.states[1], "Hover fill for primary buttons. Use content/inverse/* on it."],
      stronger: [inv.states[2], "Pressed fill for primary buttons. Use content/inverse/* on it."],
    },
    content: {
      base: [pick("neutral", NEUTRAL_STEPS, dark ? 50 : 950, onPages(TEXT)), "Default text and icons on the background and surfaces."],
      subtle: [pick("neutral", NEUTRAL_STEPS, dark ? 500 : 700, onPages(TEXT)), "Secondary text and icons on the background and surfaces: captions, placeholders, metadata."],
      inverse: {
        base: [inv.on, "Text and icons on inverse fills."],
        subtle: [pick("neutral", NEUTRAL_STEPS, dark ? 700 : 500, onInverse), "Secondary text and icons on inverse fills."],
      },
    },
    border: {
      base: [pick("neutral", NEUTRAL_STEPS, dark ? 600 : 500, onPages(UI)), `Boundaries of controls such as inputs and checkboxes. ${PAGE_3}`],
      subtle: [dark ? "neutral.800" : "neutral.200", `Decorative dividers and outlines. ${EXEMPT}`],
      focus: [pick("neutral", NEUTRAL_STEPS, dark ? 50 : 950, onPages(UI)), `Keyboard focus ring. Use with focus-ring/width and focus-ring/offset. ${PAGE_3}`],
    },
    disabled: {
      surface: [dark ? "neutral.900" : "neutral.50", `Fill of disabled controls. ${EXEMPT}`],
      content: [dark ? "neutral.600" : "neutral.400", `Text and icons of disabled controls. ${EXEMPT}`],
      border: [dark ? "neutral.800" : "neutral.200", `Border of disabled controls. ${EXEMPT}`],
    },
    utility: { scrim: [dark ? "black-alpha.70" : "black-alpha.50", "Translucent layer that dims the page behind a modal."] },
    intent,
  });
};

const alias = ([ref, description]: Token) => ({ $type: "color", $value: `{color.${ref}}`, $description: description });
const tokens = (tree: Tree): Record<string, unknown> =>
  Object.fromEntries(Object.entries(tree).map(([k, v]) => [k, Array.isArray(v) ? alias(v) : tokens(v)]));
// Same in every theme, so they live in the base set (ADR 0017).
const always = tokens({
  always: {
    white: ["white", "White in every theme, for icons and text on images. Pair with a dark overlay."],
    black: ["black", "Black in every theme, for icons and text on light images."],
  },
});

// ---------- write ----------

const write = (file: string, data: unknown) => writeFileSync(join(SRC, file), JSON.stringify(data, null, 2) + "\n");
write("primitive/color.tokens.json", palette);
write("semantic/color.tokens.json", always);
for (const mode of ["light", "dark"] as const) write(`semantic/color.${mode}.tokens.json`, semantic(mode));
console.log("✔ color tokens generated (primitive color, semantic color, color.light, color.dark)");
