import { useState, type CSSProperties, type ReactNode } from "react";
import "@pts/components/button.js";
import { products } from "../../../packages/web/products.ts";
import {
  contrast,
  DENSITIES,
  group,
  isDense,
  isExempt,
  isResponsive,
  isShaped,
  isThemed,
  leaf,
  pairsOf,
  SHAPES,
  THEMES,
  token,
  tokenCount,
  tokensAt,
  VIEWPORTS,
  type Density,
  type Shape,
  type Theme,
  type TokenInfo,
  type Viewport,
} from "./tokens";

const SAMPLE = "The quick brown fox jumps over the lazy dog";

/** A token path as the docs and Figma show it: "surface.subtle" → "surface/subtle" (CSS variables keep dashes) */
const slash = (id: string) => id.replaceAll(".", "/");

const pageBg = (theme: Theme) => token("background", theme).css;
const pageFg = (theme: Theme) => token("content.base", theme).css;

/** Top-level groups of the semantic colors (ADR 0017) */
export const COLOR_GROUPS = ["background", "surface", "inverse", "content", "border", "disabled", "utility", "always", "intent"];

// Every block is wrapped in `sb-unstyled` so Storybook's markdown table/heading styles don't apply.
const Block = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`sb-unstyled pts ${className}`}>{children}</div>
);

/**
 * Columns of a table row when it stacks (see "stacked tables" in docs.css): the first cell spans the row, the others
 * flow into this many columns, each labeled by its header (data-label). Token tables use one column per mode, or put
 * the value and its preview side by side when there is one mode.
 */
const cols = (n: number) => ({ "--docs-stack-columns": n }) as CSSProperties;

// ---------- page chrome ----------

/** Token count for one or more group prefixes, e.g. ["color"] → "76 tokens" */
const countLabel = (prefixes: string[]) => {
  const n = prefixes.reduce((sum, p) => sum + group(p).length, 0);
  return `${n} token${n === 1 ? "" : "s"}`;
};

/**
 * Page header, stacked and left-aligned: meta line (eyebrow · token count), title, lead.
 * `groups` adds the token count.
 */
export const PageHeader = ({ eyebrow, title, groups, children }: { eyebrow: string; title: string; groups?: string[]; children?: ReactNode }) => (
  <Block className="pts-header">
    <div className="pts-header-meta">
      <span className="pts-eyebrow">{eyebrow}</span>
      {groups && <span className="pts-alias">{countLabel(groups)}</span>}
    </div>
    <h1 className="pts-title">{title}</h1>
    {children && <div className="pts-lead">{children}</div>}
  </Block>
);

/**
 * Section: title, the token path it covers (e.g. "space/*", as in the Figma specimens), and lead,
 * then full-width content. Sections are separated by space; `divider` adds a hairline above (used on the Introduction).
 */
export const Section = ({ title, path, lead, divider, children }: { title: string; path?: string; lead?: ReactNode; divider?: boolean; children?: ReactNode }) => (
  <Block className={divider ? "pts-section pts-section-divider" : "pts-section"}>
    <div className="pts-section-head">
      <div className="pts-section-heading">
        <h2 className="pts-section-title">{title}</h2>
        {path && <span className="pts-section-path">{path}</span>}
      </div>
      {lead && <div className="pts-section-lead">{lead}</div>}
    </div>
    <div className="pts-section-body">{children}</div>
  </Block>
);

type Category = { title: string; path: string; description: string; preview: ReactNode };

const COMPONENT_PAGES: Category[] = [
  { title: "Button", path: "component-button", description: "Variants, sizes, and states", preview: <span className="pts-card-button">Button</span> },
];

const SEMANTIC_PAGES: Category[] = [
  {
    title: "Color",
    path: "semantic-color",
    description: "Roles, states, light and dark",
    preview: (
      <div className="pts-card-themes">
        {THEMES.map((th) => (
          <span key={th} style={{ background: pageBg(th), color: pageFg(th) }}>
            Aa
          </span>
        ))}
      </div>
    ),
  },
  { title: "Typography", path: "semantic-typography", description: "Text styles and scales", preview: <span className="pts-card-type">Aa</span> },
  {
    title: "Spacing",
    path: "semantic-spacing",
    description: "Space and layout gaps",
    preview: (
      <div className="pts-card-bars">
        {[100, 200, 400, 600].map((s) => (
          <span key={s} style={{ width: `calc(${token(`space.${s}`).css} * 4)` }} />
        ))}
      </div>
    ),
  },
  { title: "Border", path: "semantic-border", description: "Radius, stroke, focus ring", preview: <span className="pts-card-radius" /> },
  { title: "Elevation", path: "semantic-elevation", description: "Shadows and raised surfaces", preview: <span className="pts-card-shadow" /> },
  { title: "Size", path: "semantic-size", description: "Icons and control heights", preview: <span className="pts-card-size" /> },
  { title: "Motion", path: "semantic-motion", description: "Durations and easing", preview: <span className="pts-card-motion" /> },
  { title: "Layout", path: "semantic-layout", description: "Breakpoints and z-index", preview: <span className="pts-card-layers" /> },
];

const PRIMITIVE_PAGES: Category[] = [
  {
    title: "Palette",
    path: "primitive-palette",
    description: "Hues and neutrals",
    preview: (
      <div className="pts-card-ramp">
        {["red", "orange", "green", "blue", "purple"].map((h) => (
          <span key={h} style={{ background: token(`color.${h}.500`).css }} />
        ))}
      </div>
    ),
  },
  {
    title: "Scales",
    path: "primitive-scales",
    description: "Dimension, type, and motion values",
    preview: (
      <div className="pts-card-steps">
        {[4, 8, 16, 24, 32, 48].map((n) => (
          <span key={n} style={{ height: token(`dimension.${n}`).css }} />
        ))}
      </div>
    ),
  },
];

const PAGES = { component: COMPONENT_PAGES, semantic: SEMANTIC_PAGES, primitive: PRIMITIVE_PAGES };

export const CategoryCards = ({ tier }: { tier: keyof typeof PAGES }) => (
  <Block className="pts-cards">
    {PAGES[tier].map((c) => (
      <a key={c.path} className="pts-card-link" href={`./?path=/docs/${c.path}--docs`} target="_top">
        <div className="pts-card-preview">{c.preview}</div>
        <strong>{c.title}</strong>
        <span>{c.description}</span>
      </a>
    ))}
  </Block>
);

export const Stats = () => {
  const count = (prefix: string) => group(prefix).length;
  const stats = [
    { label: "Tokens", value: tokenCount() },
    { label: "Semantic colors", value: COLOR_GROUPS.reduce((sum, g) => sum + count(g), 0) },
    { label: "Text styles", value: count("text") },
    { label: "Themes", value: THEMES.length },
  ];
  return (
    <Block className="pts-stats">
      {stats.map((s) => (
        <div key={s.label}>
          <strong>{s.value}</strong>
          <span>{s.label}</span>
        </div>
      ))}
    </Block>
  );
};

const TIERS = [
  { tier: "Primitive", files: "primitive/*.tokens.json", role: "Raw values: dimension, color, typeface, weight, tracking, duration, easing" },
  { tier: "Semantic", files: "semantic/*.tokens.json", role: "Intent: space, background, content, border, text, shadow, size, motion, … Aliases primitives" },
  { tier: "Component", files: "component/*.tokens.json", role: "What one component uses, per variant, size, and state: button/primary/surface/hover, … Aliases semantic tokens" },
];

export const TierTable = () => (
  <Block className="pts-table-wrap">
    <table className="pts-table" style={cols(1)}>
      <thead>
        <tr>
          <th>Tier</th>
          <th>Files</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {TIERS.map((t) => (
          <tr key={t.tier}>
            <td>
              <strong>{t.tier}</strong>
            </td>
            <td className="pts-value" data-label="Files">
              {t.files}
            </td>
            <td data-label="Role">{t.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Block>
);

// ---------- building blocks ----------

/** CSS variable name that copies itself on click */
const CopyVar = ({ name }: { name: string }) => {
  const [copied, setCopied] = useState(false);
  const text = `var(${name})`;
  return (
    <button
      type="button"
      className="pts-var"
      title="Copy"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? "Copied" : text}
    </button>
  );
};

const Ratio = ({ value, min }: { value: number; min: number }) => (
  <span className={value >= min ? "pts-badge pts-pass" : "pts-badge pts-fail"}>
    {value >= min ? "AA" : "Fail"} {value.toFixed(2)}
  </span>
);

const Exempt = () => <span className="pts-badge pts-exempt">Exempt</span>;

/**
 * A cell rendered in a given theme. data-theme="dark" makes every token variable inside
 * resolve to its dark value (see the [data-theme] block in @pts/web tokens.css).
 */
const ThemeCell = ({ theme, children, style }: { theme: Theme; children: ReactNode; style?: CSSProperties }) => (
  <div data-theme={theme} className="pts-theme-cell" style={{ background: pageBg(theme), color: pageFg(theme), ...style }}>
    {children}
  </div>
);

/**
 * A cell rendered at a given density. data-density="compact" makes every density variable inside resolve to its
 * compact value (see the [data-density] blocks in @pts/web tokens.css), whatever the page's density toggle says.
 */
const DensityCell = ({ density, children }: { density: Density; children: ReactNode }) => (
  <div data-density={density} className="pts-density-cell">
    {children}
  </div>
);

/**
 * A cell rendered in a given shape. data-shape="round" makes every shape variable inside resolve to its round value
 * (see the [data-shape] blocks in @pts/web tokens.css), whatever the page's shape toggle says.
 */
const ShapeCell = ({ shape, children }: { shape: Shape; children: ReactNode }) => <div data-shape={shape}>{children}</div>;

/**
 * A preview gets the token at its column's permutation. Viewport columns can't switch the media query, so a preview
 * that depends on the viewport uses resolved values (t.css), not variables.
 */
type Preview = (t: TokenInfo, theme: Theme, viewport: Viewport) => ReactNode;
type Column = { key: string; label: string; theme: Theme; density: Density; viewport: Viewport; shape: Shape };

/**
 * Generic token table. Shows light and dark columns when the group differs by theme, relaxed and compact columns
 * when it differs by density, narrow and wide columns when it differs by viewport, and soft and round columns when it
 * differs by shape.
 */
export const TokenTable = ({ prefix, preview }: { prefix: string; preview?: Preview }) => {
  const themed = isThemed(prefix);
  const dense = !themed && isDense(prefix);
  const responsive = !themed && !dense && isResponsive(prefix);
  const shaped = !themed && !dense && !responsive && isShaped(prefix);
  const defaults = { theme: "light", density: "relaxed", viewport: "narrow", shape: "soft" } as const;
  const columns: Column[] = themed
    ? THEMES.map((theme) => ({ ...defaults, key: theme, label: theme, theme }))
    : dense
      ? DENSITIES.map((density) => ({ ...defaults, key: density, label: density, density }))
      : responsive
        ? VIEWPORTS.map((viewport) => ({ ...defaults, key: viewport, label: viewport, viewport }))
        : shaped
          ? SHAPES.map((shape) => ({ ...defaults, key: shape, label: shape, shape }))
          : [{ ...defaults, key: "value", label: "Value" }];
  const split = columns.length > 1;
  const previewLabel = (c: Column) => (split ? `Preview · ${c.label}` : "Preview");
  return (
    <Block className={split && preview ? "pts-table-wrap pts-table-split" : "pts-table-wrap"}>
      <table className="pts-table" style={cols(split || !preview ? columns.length : 2)}>
        <thead>
          <tr>
            <th>Token</th>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            {preview && columns.map((c) => <th key={`p-${c.key}`}>{previewLabel(c)}</th>)}
          </tr>
        </thead>
        <tbody>
          {group(prefix).map((t) => (
            <tr key={t.id}>
              <td className="pts-token-cell">
                <span className="pts-token-name">{slash(t.id === prefix ? leaf(t.id) : t.id.slice(prefix.length + 1))}</span>
                {t.description && <span className="pts-description">{t.description}</span>}
                <CopyVar name={t.cssVar} />
              </td>
              {columns.map((c) => {
                const v = token(t.id, c.theme, c.density, c.viewport, c.shape);
                return (
                  <td key={c.key} className="pts-value-cell" data-label={c.label}>
                    <span className="pts-value">{v.display}</span>
                    {v.alias && <span className="pts-alias">→ {slash(v.alias)}</span>}
                  </td>
                );
              })}
              {preview &&
                columns.map((c) => {
                  const v = token(t.id, c.theme, c.density, c.viewport, c.shape);
                  return (
                    <td key={`p-${c.key}`} className="pts-preview-cell" data-label={previewLabel(c)}>
                      {themed ? (
                        <ThemeCell theme={c.theme}>{preview(v, c.theme, c.viewport)}</ThemeCell>
                      ) : dense ? (
                        <DensityCell density={c.density}>{preview(v, c.theme, c.viewport)}</DensityCell>
                      ) : shaped ? (
                        <ShapeCell shape={c.shape}>{preview(v, c.theme, c.viewport)}</ShapeCell>
                      ) : (
                        preview(v, c.theme, c.viewport)
                      )}
                    </td>
                  );
                })}
            </tr>
          ))}
        </tbody>
      </table>
    </Block>
  );
};

// ---------- color ----------

/** A hue's ramp (hue="red"), or listed colors that are not a group of their own (ids={["color.white", "color.black"]}) */
export const Palette = ({ hue, ids }: { hue?: string; ids?: string[] }) => {
  const steps = ids ? ids.map((id) => token(id)) : group(`color.${hue}`);
  return (
    <Block className="pts-palette">
      <div className="pts-ramp">
        {steps.map((t) => {
          const opaque = (t.resolved.alpha ?? 1) === 1;
          const onWhite = opaque ? contrast(t.resolved.hex, "#ffffff") : 0;
          const onBlack = opaque ? contrast(t.resolved.hex, "#000000") : 0;
          const alpha = t.resolved.alpha ?? 1;
          const labelColor = opaque ? (onBlack >= onWhite ? "#000000" : "#ffffff") : alpha >= 0.5 ? "#ffffff" : "#000000";
          return (
            <div key={t.id} className="pts-ramp-step" style={{ background: t.css, color: labelColor }}>
              <span className="pts-ramp-name">{leaf(t.id)}</span>
            </div>
          );
        })}
      </div>
      <div className="pts-ramp-meta">
        {steps.map((t) => {
          const opaque = (t.resolved.alpha ?? 1) === 1;
          return (
            <div key={t.id}>
              <span className="pts-value">{t.display}</span>
              {opaque && (
                <>
                  <span className="pts-alias">W {contrast(t.resolved.hex, "#ffffff").toFixed(1)}</span>
                  <span className="pts-alias">B {contrast(t.resolved.hex, "#000000").toFixed(1)}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Block>
  );
};

/** How a color token is drawn, from its path: content as text, border as an outline, anything else as a fill */
const property = (id: string) => {
  const path = id.split(".");
  return path.includes("content") ? "content" : path.includes("border") ? "border" : "fill";
};

/** A background id without its intent, as a short label: intent.danger.surface.base → surface.base */
const bgLabel = (id: string) => id.replace(/^intent\.[^.]+\./, "");

/**
 * A color token shown the way it is used, with the lowest contrast among the pairs npm run check tests:
 * content on its first paired background, borders as an outline, fills as a chip.
 */
const colorPreview = (t: TokenInfo, theme: Theme) => {
  const checks = pairsOf(t.id).map(({ bg, min }) => ({ bg: token(bg, theme), min, ratio: contrast(t.resolved.hex, token(bg, theme).resolved.hex) }));
  const worst = [...checks].sort((a, b) => a.ratio / a.min - b.ratio / b.min)[0];
  const kind = property(t.id);
  const sample =
    kind === "content" ? (
      // An exempt color (disabled/*, ...) is shown at its real contrast, so scripts/a11y.ts skips it as the lint does.
      <span
        className="pts-pair-sample"
        style={{ background: checks[0]?.bg.css ?? pageBg(theme), color: t.css }}
        data-a11y-exempt={isExempt(t.id) || undefined}
      >
        Aa Text
      </span>
    ) : kind === "border" ? (
      <span className="pts-chip" style={{ border: `2px solid ${t.css}`, background: "transparent" }} />
    ) : (
      <span className="pts-chip" style={{ background: t.css }} />
    );
  return (
    <div className="pts-pair">
      {sample}
      {isExempt(t.id) ? <Exempt /> : worst && <Ratio value={worst.ratio} min={worst.min} />}
      {worst && <span className="pts-alias">lowest on {slash(bgLabel(worst.bg.id))}</span>}
    </div>
  );
};

/** Color tokens under a prefix (e.g. "content", "intent.danger") with their paired contrast */
export const ColorTable = ({ prefix }: { prefix: string }) => <TokenTable prefix={prefix} preview={colorPreview} />;

// ---------- typography ----------

/** Text style specimens. They use the variables, so they follow this window's viewport; the meta line names both. */
export const TextStyles = () => (
  <Block className="pts-specimens">
    {group("text").map((t) => {
      const wide = token(t.id, "light", "relaxed", "wide");
      return (
        <div key={t.id} className="pts-specimen">
          <div className="pts-specimen-meta">
            <span className="pts-token-name">{leaf(t.id)}</span>
            {t.description && <span className="pts-description">{t.description}</span>}
            {wide.display === t.display ? (
              <span className="pts-alias">{t.display}</span>
            ) : (
              VIEWPORTS.map((vp) => (
                <span key={vp} className="pts-alias">
                  {vp} {(vp === "wide" ? wide : t).display}
                </span>
              ))
            )}
            <CopyVar name={t.cssVar} />
          </div>
          <div className="pts-specimen-text" style={{ font: `var(${t.cssVar})`, letterSpacing: `var(${t.cssVar}-letter-spacing)` }}>
            {SAMPLE}
          </div>
        </div>
      );
    })}
  </Block>
);

export const FontPreview = ({ kind }: { kind: "family" | "weight" | "size" }) => {
  const prefix = `font-${kind}`;
  // size: the line height paired with the size in the same column (resolved, since the viewport columns can't use variables)
  const style = (t: TokenInfo, viewport: Viewport): CSSProperties =>
    kind === "family"
      ? { fontFamily: t.css }
      : kind === "weight"
        ? { fontWeight: t.css }
        : { fontSize: t.css, lineHeight: token(t.id.replace("font-size.", "line-height."), "light", "relaxed", viewport).css };
  return <TokenTable prefix={prefix} preview={(t, _theme, viewport) => <span style={style(t, viewport)}>{kind === "size" ? "Aa" : "Aa Bb Cc 0123"}</span>} />;
};

// ---------- scales ----------

/** Horizontal bars for dimension scales (space, layout, size, breakpoint) */
export const Bars = ({ prefix, max }: { prefix: string; max?: number }) => (
  <TokenTable
    prefix={prefix}
    preview={(t) => {
      const px = t.resolved.value as number;
      const width = max ? `${(px / max) * 100}%` : `${px}px`;
      return (
        <div className="pts-bar-track">
          <div className="pts-bar" style={{ width }} />
        </div>
      );
    }}
  />
);

/**
 * Spacing roles drawn the way they're used, as on the Figma specimen: the blocks are content, the area around or
 * between them is the token value.
 * Padding is the frame around a content block; gap is the space between two blocks.
 */
export const PaddingSamples = () => (
  <TokenTable
    prefix="padding"
    preview={(t) => (
      <div className="pts-space-sample" style={{ padding: `var(${t.cssVar})` }}>
        <span className="pts-space-block pts-space-block-wide" />
      </div>
    )}
  />
);

export const GapSamples = () => (
  <TokenTable
    prefix="gap"
    preview={(t) => (
      <div className="pts-space-sample" style={{ gap: `var(${t.cssVar})` }}>
        <span className="pts-space-block" />
        <span className="pts-space-block" />
      </div>
    )}
  />
);

export const RadiusSamples = () => (
  <TokenTable prefix="radius" preview={(t) => <div className="pts-box" style={{ borderRadius: t.css }} />} />
);

export const StrokeSamples = () => (
  <TokenTable prefix="stroke" preview={(t) => <div className="pts-box pts-box-outline" style={{ borderWidth: t.css }} />} />
);

export const IconSizes = () => (
  <TokenTable prefix="size.icon" preview={(t) => <div className="pts-icon-sample" style={{ width: t.css, height: t.css }} />} />
);

export const ControlSizes = () => (
  <TokenTable prefix="size.control" preview={(t) => <div className="pts-control-sample" style={{ height: t.css }}>Button</div>} />
);

export const FocusRing = () => (
  <Block className="pts-row">
    {THEMES.map((th) => (
      <ThemeCell key={th} theme={th} style={{ padding: "var(--space-800)", display: "flex", alignItems: "center", gap: "var(--space-400)" }}>
        <button
          type="button"
          className="pts-focus-demo"
          style={{
            background: token("inverse.base", th).css,
            color: token("content.inverse.base", th).css,
            outline: `${token("focus-ring.width").css} solid ${token("border.focus", th).css}`,
            outlineOffset: token("focus-ring.offset").css,
            height: token("size.control.md").css,
            borderRadius: "var(--radius-control)",
          }}
        >
          Focused
        </button>
        <span className="pts-alias">{th}</span>
      </ThemeCell>
    ))}
  </Block>
);

// ---------- elevation ----------

export const Shadows = () => (
  <Block className="pts-row">
    {THEMES.map((th) => (
      <ThemeCell key={th} theme={th} style={{ padding: "var(--space-800)" }}>
        <div className="pts-shadow-grid">
          {group("shadow", th).map((t) => (
            <div key={t.id} className="pts-shadow-card" style={{ boxShadow: t.css }}>
              <span className="pts-token-name">{leaf(t.id)}</span>
              {t.description && <span className="pts-description">{t.description}</span>}
              <span className="pts-alias">{t.display}</span>
            </div>
          ))}
        </div>
        <span className="pts-alias">{th}</span>
      </ThemeCell>
    ))}
  </Block>
);

export const Overlay = () => (
  <Block className="pts-row">
    {THEMES.map((th) => (
      <ThemeCell key={th} theme={th} style={{ position: "relative", height: "var(--docs-overlay-height)", overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "var(--space-500)" }}>
          <div className="pts-skeleton" style={{ width: "60%" }} />
          <div className="pts-skeleton" style={{ width: "80%" }} />
          <div className="pts-skeleton" style={{ width: "40%" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: token("utility.scrim", th).css }} />
        <div className="pts-modal" style={{ boxShadow: token("shadow.xl", th).css }}>
          <strong>Modal</strong>
          <span className="pts-alias">{th} · scrim {token("utility.scrim", th).display}</span>
        </div>
      </ThemeCell>
    ))}
  </Block>
);

// ---------- motion ----------

export const MotionDemo = () => (
  <Block className="pts-table-wrap">
    <table className="pts-table" style={cols(group("motion.easing").length)}>
      <thead>
        <tr>
          <th>Duration</th>
          {group("motion.easing").map((e) => (
            <th key={e.id}>{leaf(e.id)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {group("motion.duration").map((d) => (
          <tr key={d.id}>
            <td className="pts-token-cell">
              <span className="pts-token-name">{leaf(d.id)}</span>
              <span className="pts-alias">{d.display}</span>
            </td>
            {group("motion.easing").map((e) => (
              <td key={e.id} data-label={leaf(e.id)}>
                <div className="pts-track" title="Hover to play">
                  <div className="pts-dot" style={{ transitionDuration: d.css, transitionTimingFunction: e.css }} />
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </Block>
);

// ---------- layers ----------

/** The layers as one aligned column, highest on top: reading down goes from front to back */
export const ZIndexStack = () => (
  <Block className="pts-stack">
    <span className="pts-alias">Front</span>
    {[...group("z-index")].reverse().map((t) => (
      <div key={t.id} className="pts-layer">
        <span className="pts-token-name">{leaf(t.id)}</span>
        <span className="pts-alias">{t.display}</span>
      </div>
    ))}
    <span className="pts-alias">Back</span>
  </Block>
);

// ---------- products ----------

// The example products of packages/web/products.ts (ADR 0047), each a fixed set of modifier inputs
const PRODUCTS = Object.entries(products);
const inputsLabel = (input: Record<string, string>) =>
  Object.entries(input)
    .map(([modifier, context]) => `${modifier} ${context}`)
    .join(", ");

/** Each product: what it fixes, and its two imports */
export const ProductList = () => (
  <Block className="pts-table-wrap">
    <table className="pts-table" style={cols(2)}>
      <thead>
        <tr>
          <th>Product</th>
          <th>Fixes</th>
          <th>Imports</th>
        </tr>
      </thead>
      <tbody>
        {PRODUCTS.map(([name, input]) => (
          <tr key={name}>
            <td className="pts-token-cell">
              <span className="pts-token-name">{name}</span>
            </td>
            <td className="pts-value-cell" data-label="Fixes">
              <span className="pts-value">{inputsLabel(input)}</span>
            </td>
            <td className="pts-value-cell" data-label="Imports">
              <span className="pts-value">@pts/web/products/{name}.css</span>
              <span className="pts-value">@pts/web/products/{name}.js</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </Block>
);

/**
 * The same small layout in each product. One page has one :root, so the cells don't load the product files: each
 * sets its product's inputs as tokens.css attributes (data-density, data-shape), which give the values the product's
 * :root holds; npm test checks both files against the resolver. The theme follows the page toggle, as it would in the
 * product.
 */
export const ProductPreview = () => (
  <Block className="pts-button-preview">
    {PRODUCTS.map(([name, input]) => {
      // the viewport is the window, so it has no attribute (ADR 0029)
      const attributes = Object.fromEntries(
        Object.entries(input)
          .filter(([modifier]) => modifier !== "viewport")
          .map(([modifier, context]) => [`data-${modifier}`, context]),
      );
      return (
        <div key={name} className="pts-button-preview-cell" {...attributes}>
          <span className="pts-alias">
            {name} · {inputsLabel(input)}
          </span>
          <div className="pts-product-sample">
            <strong className="pts-product-title">Invite people</strong>
            <span>Members can edit every page in this space.</span>
            <div className="pts-product-actions">
              <pts-button variant="primary">Send invite</pts-button>
              <pts-button>Cancel</pts-button>
            </div>
          </div>
        </div>
      );
    })}
  </Block>
);

/** The tokens whose values differ between the products, side by side, each at its product's inputs */
export const ProductDiff = () => {
  const columns = PRODUCTS.map(([name, input]) => ({ name, tokens: new Map(tokensAt(input).map((t) => [t.id, t])) }));
  const rows = tokensAt({}).filter((t) => new Set(columns.map((c) => c.tokens.get(t.id)?.css)).size > 1);
  return (
    <Block className="pts-table-wrap">
      <table className="pts-table" style={cols(columns.length)}>
        <thead>
          <tr>
            <th>Token</th>
            {columns.map((c) => (
              <th key={c.name}>{c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td className="pts-token-cell">
                <span className="pts-token-name">{slash(t.id)}</span>
                <CopyVar name={t.cssVar} />
              </td>
              {columns.map((c) => {
                const v = c.tokens.get(t.id);
                return (
                  <td key={c.name} className="pts-value-cell" data-label={c.name}>
                    <span className="pts-value">{v?.display}</span>
                    {v?.alias && <span className="pts-alias">→ {slash(v.alias)}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Block>
  );
};
