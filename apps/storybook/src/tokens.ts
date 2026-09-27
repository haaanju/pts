// Reads the DTCG source through pts.resolver.json and resolves every token per theme,
// so the docs always reflect the current token files.
import { contrastPairs } from "../../../tokens/lint/pairs.ts";

export { isExempt, TEXT, UI } from "../../../tokens/lint/pairs.ts";

type Json = Record<string, any>;
type Ref = { $ref: string };

export type Theme = "light" | "dark";
export const THEMES: Theme[] = ["light", "dark"];

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
}

const files = import.meta.glob("../../../tokens/src/**/*.json", { eager: true, import: "default" }) as Record<string, Json>;
const read = (ref: string) => {
  const file = files[`../../../tokens/src/${ref}`];
  if (!file) throw new Error(`Token file not found: ${ref}`);
  return file;
};

const resolver = read("pts.resolver.json");

const flatten = (node: Json, prefix = "", out: Record<string, Json> = {}) => {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const id = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && "$value" in value) out[id] = value;
    else if (value && typeof value === "object") flatten(value, id, out);
  }
  return out;
};
const load = (refs: Ref[]): Record<string, Json> => Object.assign({}, ...refs.map((r) => flatten(read(r.$ref))));

const baseRefs: Ref[] = Object.values(resolver.sets as Record<string, { sources: Ref[] }>).flatMap((s) => s.sources);
const themeRefs = resolver.modifiers.theme.contexts as Record<Theme, Ref[]>;

const ALIAS = /^\{([^}]+)\}$/;

const resolveValue = (raw: Record<string, Json>, value: any): any => {
  if (typeof value === "string") {
    const m = value.match(ALIAS);
    return m ? resolveValue(raw, raw[m[1]].$value) : value;
  }
  if (Array.isArray(value)) return value.map((v) => resolveValue(raw, v));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveValue(raw, v)]));
  }
  return value;
};

const fmtColor = (c: { hex: string; alpha?: number; components: number[] }, forCss: boolean) => {
  const alpha = c.alpha ?? 1;
  if (alpha === 1) return c.hex.toUpperCase();
  if (forCss) return `rgb(${c.components.map((v) => Math.round(v * 255)).join(" ")} / ${alpha})`;
  return `${c.hex.toUpperCase()} · ${Math.round(alpha * 100)}%`;
};
const fmtDim = (d: { value: number; unit: string }) => `${d.value}${d.unit}`;

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
      return [v.offsetX, v.offsetY, v.blur, v.spread].map(fmtDim).join(" ") + " " + fmtColor(v.color, forCss);
    case "typography":
      return forCss
        ? `${v.fontWeight} ${fmtDim(v.fontSize)}/${v.lineHeight} ${format("fontFamily", v.fontFamily, true)}`
        : `${fmtDim(v.fontSize)} / ${v.lineHeight} · ${v.fontWeight} · ${v.fontFamily[0]}`;
    default:
      return String(v);
  }
};

const build = (theme: Theme): Record<string, TokenInfo> => {
  const raw = { ...load(baseRefs), ...load(themeRefs[theme]) };
  return Object.fromEntries(
    Object.entries(raw).map(([id, t]) => {
      const resolved = resolveValue(raw, t.$value);
      const alias = typeof t.$value === "string" ? t.$value.match(ALIAS)?.[1] : undefined;
      const info: TokenInfo = {
        id,
        type: t.$type,
        cssVar: `--${id.replaceAll(".", "-")}`,
        alias,
        resolved,
        display: format(t.$type, resolved, false),
        css: format(t.$type, resolved, true),
      };
      return [id, info];
    }),
  );
};

const byTheme: Record<Theme, Record<string, TokenInfo>> = { light: build("light"), dark: build("dark") };

export const token = (id: string, theme: Theme = "light") => {
  const t = byTheme[theme][id];
  if (!t) throw new Error(`Unknown token: ${id}`);
  return t;
};

/** Tokens under a group prefix (e.g. "intent.danger"), or the single token with that id (e.g. "background"), in file order */
export const group = (prefix: string, theme: Theme = "light") =>
  Object.values(byTheme[theme]).filter((t) => t.id === prefix || t.id.startsWith(`${prefix}.`));

/** True if any token under the prefix resolves differently between themes */
export const isThemed = (prefix: string) =>
  group(prefix, "light").some((t) => t.css !== token(t.id, "dark").css);

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

const pairs = contrastPairs(Object.keys(byTheme.light));

/** The backgrounds a content, border, or fill token is checked against, with the minimum ratio (same pairs as npm run check) */
export const pairsOf = (id: string) => pairs.filter(([fg]) => fg === id).map(([, bg, min]) => ({ bg, min }));

/** Total number of tokens (identical across themes) */
export const tokenCount = () => Object.keys(byTheme.light).length;
