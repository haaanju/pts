// The docs' data layer: every token per permutation (theme × density × viewport × shape) as Terrazzo resolves it,
// built by scripts/docs-tokens.ts from the current token files (ADR 0038). Nothing here resolves an alias.
import data from "virtual:pts-tokens";
import { contrastPairs, isExempt as isExemptSemantic } from "../../../tokens/lint/pairs.ts";

export type Theme = "light" | "dark";
export const THEMES: Theme[] = ["light", "dark"];
export type Density = "relaxed" | "compact";
export const DENSITIES: Density[] = ["relaxed", "compact"];
export type Viewport = "narrow" | "wide";
export const VIEWPORTS: Viewport[] = ["narrow", "wide"];
export type Shape = "soft" | "round";
export const SHAPES: Shape[] = ["soft", "round"];

export interface TokenInfo {
  id: string;
  type: string;
  cssVar: string;
  /** direct alias target, if the token is an alias */
  alias?: string;
  /** fully resolved $value (aliases replaced, including inside composites) */
  resolved: any;
  /** human-readable value */
  display: string;
  /** value usable in inline CSS */
  css: string;
  /** $description: when to use the token (every semantic token has one; primitives don't) */
  description?: string;
}

const fmtColor = (c: { hex: string; alpha?: number; components: number[] }, forCss: boolean) => {
  const alpha = c.alpha ?? 1;
  if (alpha === 1) return c.hex.toUpperCase();
  if (forCss) return `rgb(${c.components.map((v) => Math.round(v * 255)).join(" ")} / ${alpha})`;
  return `${c.hex.toUpperCase()} · ${Math.round(alpha * 100)}%`;
};
const fmtDim = (d: { value: number; unit: string }) => `${d.value}${d.unit}`;
/** Display only: ratios like 20/14 are stored at full precision so size × ratio stays exact; CSS keeps that precision */
const fmtNum = (n: number) => String(+n.toFixed(3));
/** The px line a line-height ratio produces on its font size, rounded away from float noise */
const linePx = (size: number, ratio: number) => +(size * ratio).toFixed(2);

const format = (type: string, v: any, forCss: boolean): string => {
  switch (type) {
    case "color":
      return fmtColor(v, forCss);
    case "dimension":
    case "duration":
      return fmtDim(v);
    case "fontFamily":
      return (v as string[]).map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(", ");
    case "cubicBezier":
      return `cubic-bezier(${(v as number[]).join(", ")})`;
    case "shadow":
      // Terrazzo normalizes a shadow to a list of layers, as CSS box-shadow takes them
      return (v as any[]).map((s) => [s.offsetX, s.offsetY, s.blur, s.spread].map(fmtDim).join(" ") + " " + fmtColor(s.color, forCss)).join(", ");
    case "typography":
      return forCss
        ? `${v.fontWeight} ${fmtDim(v.fontSize)}/${v.lineHeight} ${format("fontFamily", v.fontFamily, true)}`
        : `${v.fontSize.value}/${linePx(v.fontSize.value, v.lineHeight)}${v.fontSize.unit} · ${v.fontWeight} · ${v.fontFamily[0]}`;
    case "number":
      return forCss ? String(v) : fmtNum(v);
    default:
      return String(v);
  }
};

type Key = `${Theme}/${Density}/${Viewport}/${Shape}`;

const build = (key: Key): Record<string, TokenInfo> => {
  const values = data.values[key];
  return Object.fromEntries(
    data.tokens
      .filter(({ id }) => values[id])
      .map(({ id, type, description }) => {
        const { value: resolved, alias } = values[id];
        // A line height pairs with the font size of the same name (ADR 0028): show the line it produces
        const size = id.startsWith("line-height.") ? values[id.replace("line-height.", "font-size.")] : undefined;
        const sizePx = size && (size.value as { value: number }).value;
        const info: TokenInfo = {
          id,
          type,
          cssVar: `--${id.replaceAll(".", "-")}`,
          alias,
          resolved,
          display: sizePx ? `${fmtNum(resolved as number)} · ${linePx(sizePx, resolved as number)}px line` : format(type, resolved, false),
          css: format(type, resolved, true),
          description,
        };
        return [id, info];
      }),
  );
};

/** Every theme × density × viewport × shape permutation, as the resolver applies them */
const keys = THEMES.flatMap((theme) =>
  DENSITIES.flatMap((density) => VIEWPORTS.flatMap((viewport) => SHAPES.map((shape): Key => `${theme}/${density}/${viewport}/${shape}`))),
);
const byMode = Object.fromEntries(keys.map((key) => [key, build(key)])) as Record<Key, Record<string, TokenInfo>>;
const at = (theme: Theme, density: Density, viewport: Viewport, shape: Shape = "soft") => byMode[`${theme}/${density}/${viewport}/${shape}`];

export const token = (id: string, theme: Theme = "light", density: Density = "relaxed", viewport: Viewport = "narrow", shape: Shape = "soft") => {
  const t = at(theme, density, viewport, shape)[id];
  if (!t) throw new Error(`Unknown token: ${id}`);
  return t;
};

/**
 * Every token at a set of modifier inputs, the rest at their defaults: a product's inputs (packages/web/products.ts)
 * give the values its :root holds (ADR 0047)
 */
export const tokensAt = (input: Record<string, string>) =>
  Object.values(
    at(
      (input.theme ?? "light") as Theme,
      (input.density ?? "relaxed") as Density,
      (input.viewport ?? "narrow") as Viewport,
      (input.shape ?? "soft") as Shape,
    ),
  );

/** Tokens under a group prefix (e.g. "intent.danger"), or the single token with that id (e.g. "background"), in file order */
export const group = (prefix: string, theme: Theme = "light", density: Density = "relaxed", viewport: Viewport = "narrow") =>
  Object.values(at(theme, density, viewport)).filter((t) => t.id === prefix || t.id.startsWith(`${prefix}.`));

/** True if any token under the prefix resolves differently between themes */
export const isThemed = (prefix: string) => group(prefix, "light").some((t) => t.css !== token(t.id, "dark").css);

/** True if any token under the prefix resolves differently between densities */
export const isDense = (prefix: string) => group(prefix).some((t) => t.css !== token(t.id, "light", "compact").css);

/** True if any token under the prefix resolves differently between viewports */
export const isResponsive = (prefix: string) => group(prefix).some((t) => t.css !== token(t.id, "light", "relaxed", "wide").css);

/** True if any token under the prefix resolves differently between shapes */
export const isShaped = (prefix: string) => group(prefix).some((t) => t.css !== token(t.id, "light", "relaxed", "narrow", "round").css);

/** Last path segment, e.g. "intent.danger.surface.strong" → "strong" */
export const leaf = (id: string) => id.slice(id.lastIndexOf(".") + 1);

// ---- contrast (WCAG 2.x) — same rules as the pts/contrast lint rule ----

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const pairs = contrastPairs(Object.keys(at("light", "relaxed", "narrow")));

/** Ids of the component tier (component/*.tokens.json), which alias semantic tokens (ADR 0032) */
const componentIds = new Set(data.tokens.filter((t) => t.tier === "component").map((t) => t.id));

/** The semantic token a component token aliases (button.primary.content → content.inverse.base); other ids unchanged */
const semanticOf = (id: string): string => (componentIds.has(id) ? semanticOf(token(id).alias ?? id) : id);

/**
 * The backgrounds a content, border, or fill token is checked against, with the minimum ratio (same pairs as npm run
 * check). A component token has the pairs of the semantic token it aliases, which pts/component-pairs ties to it.
 */
export const pairsOf = (id: string) => {
  const target = semanticOf(id);
  return pairs.filter(([fg]) => fg === target).map(([, bg, min]) => ({ bg, min }));
};

/** True for colors exempt from contrast (pairs.ts); a component token is exempt if the semantic token it aliases is */
export const isExempt = (id: string) => isExemptSemantic(semanticOf(id));

/** Total number of tokens (identical across every permutation) */
export const tokenCount = () => Object.keys(at("light", "relaxed", "narrow")).length;
