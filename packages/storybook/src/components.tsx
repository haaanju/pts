import type { CSSProperties, ReactNode } from "react";
import { contrast, group, isThemed, leaf, pairedBackground, THEMES, token, type Theme, type TokenInfo } from "./tokens";

const TEXT = 4.5;
const UI = 3;

const pageBg = (theme: Theme) => token("color.background.default", theme).css;
const pageFg = (theme: Theme) => token("color.foreground.default", theme).css;

// ---------- building blocks ----------

const Code = ({ children }: { children: ReactNode }) => <code className="pts-code">{children}</code>;

const Ratio = ({ value, min }: { value: number; min: number }) => (
  <span className={value >= min ? "pts-badge pts-pass" : "pts-badge pts-fail"}>
    {value.toFixed(2)} {value >= min ? "✓" : "✗"}
  </span>
);

/**
 * A cell rendered in a given theme. data-theme="dark" makes every token variable inside
 * resolve to its dark value (see the [data-theme] block in @pts/css).
 */
const ThemeCell = ({ theme, children, style }: { theme: Theme; children: ReactNode; style?: CSSProperties }) => (
  <div data-theme={theme} className="pts-theme-cell" style={{ background: pageBg(theme), color: pageFg(theme), ...style }}>
    {children}
  </div>
);

type Preview = (t: TokenInfo, theme: Theme) => ReactNode;

/**
 * Generic token table. Shows light and dark columns when the group differs by theme.
 */
export const TokenTable = ({ prefix, preview }: { prefix: string; preview?: Preview }) => {
  const themed = isThemed(prefix);
  const themes = themed ? THEMES : (["light"] as Theme[]);
  return (
    <table className="pts-table">
      <thead>
        <tr>
          <th>Token</th>
          <th>Alias</th>
          {themes.map((th) => (
            <th key={th}>{themed ? `Value (${th})` : "Value"}</th>
          ))}
          {preview && themes.map((th) => <th key={`p-${th}`}>{themed ? `Preview (${th})` : "Preview"}</th>)}
        </tr>
      </thead>
      <tbody>
        {group(prefix).map((t) => (
          <tr key={t.id}>
            <td>
              <strong>{t.id.slice(prefix.length + 1)}</strong>
              <br />
              <Code>{`var(${t.cssVar})`}</Code>
            </td>
            <td>{themed ? themes.map((th) => <div key={th}>{token(t.id, th).alias ?? "—"}</div>) : (t.alias ?? "—")}</td>
            {themes.map((th) => (
              <td key={th}>{token(t.id, th).display}</td>
            ))}
            {preview &&
              themes.map((th) => (
                <td key={`p-${th}`}>
                  <ThemeCell theme={th}>{preview(token(t.id, th), th)}</ThemeCell>
                </td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ---------- color ----------

export const Palette = ({ hue }: { hue: string }) => {
  const steps = group(`palette.${hue}`);
  return (
    <div className="pts-palette">
      {steps.map((t) => {
        const onWhite = contrast(t.resolved.hex, "#ffffff");
        const onBlack = contrast(t.resolved.hex, "#000000");
        return (
          <div key={t.id} className="pts-swatch">
            <div className="pts-swatch-chip" style={{ background: t.css }} />
            <strong>{leaf(t.id)}</strong>
            <span>{t.display}</span>
            {(t.resolved.alpha ?? 1) === 1 && (
              <span className="pts-muted">
                W {onWhite.toFixed(1)} · B {onBlack.toFixed(1)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const BackgroundTable = () => (
  <TokenTable prefix="color.background" preview={(t) => <div className="pts-chip" style={{ background: t.css }} />} />
);

/** Foregrounds shown on their paired background with the contrast ratio */
export const ForegroundTable = () => (
  <TokenTable
    prefix="color.foreground"
    preview={(t, theme) => {
      const bg = token(pairedBackground(t.id), theme);
      const disabled = leaf(t.id) === "disabled";
      return (
        <div className="pts-pair">
          <span className="pts-pair-sample" style={{ background: bg.css, color: t.css }}>
            Aa 가나다
          </span>
          <span className="pts-muted">on {leaf(bg.id)}</span>
          {disabled ? <span className="pts-muted">exempt</span> : <Ratio value={contrast(t.resolved.hex, bg.resolved.hex)} min={TEXT} />}
        </div>
      );
    }}
  />
);

export const BorderTable = () => (
  <TokenTable
    prefix="color.border"
    preview={(t, theme) => {
      const exempt = ["default", "disabled"].includes(leaf(t.id));
      return (
        <div className="pts-pair">
          <span className="pts-chip" style={{ border: `2px solid ${t.css}`, background: "transparent" }} />
          {exempt ? (
            <span className="pts-muted">exempt</span>
          ) : (
            <Ratio value={contrast(t.resolved.hex, token("color.background.default", theme).resolved.hex)} min={UI} />
          )}
        </div>
      );
    }}
  />
);

// ---------- typography ----------

export const TextStyles = () => (
  <table className="pts-table">
    <thead>
      <tr>
        <th>Style</th>
        <th>Value</th>
        <th>Specimen</th>
      </tr>
    </thead>
    <tbody>
      {group("text").map((t) => (
        <tr key={t.id}>
          <td>
            <strong>{leaf(t.id)}</strong>
            <br />
            <Code>{`font: var(${t.cssVar})`}</Code>
          </td>
          <td>{t.display}</td>
          <td style={{ font: `var(${t.cssVar})`, letterSpacing: `var(${t.cssVar}-letter-spacing)` }}>
            다람쥐 헌 쳇바퀴에 타고파 The quick brown fox
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

// ---------- scales ----------

/** Horizontal bars for dimension scales (space, layout, size, breakpoint) */
export const Bars = ({ prefix, max }: { prefix: string; max?: number }) => (
  <TokenTable
    prefix={prefix}
    preview={(t) => {
      const px = t.resolved.value as number;
      const width = max ? `${(px / max) * 100}%` : `${px}px`;
      return <div className="pts-bar" style={{ width }} />;
    }}
  />
);

export const RadiusSamples = () => (
  <TokenTable prefix="radius" preview={(t) => <div className="pts-box" style={{ borderRadius: t.css }} />} />
);

export const StrokeSamples = () => (
  <TokenTable prefix="stroke" preview={(t) => <div className="pts-box" style={{ border: `${t.css} solid currentColor`, background: "transparent" }} />} />
);

export const FocusRing = () => (
  <div className="pts-row">
    {THEMES.map((th) => (
      <ThemeCell key={th} theme={th} style={{ padding: 24 }}>
        <button
          type="button"
          className="pts-focus-demo"
          style={{
            background: token("color.background.primary", th).css,
            color: token("color.foreground.on-primary", th).css,
            outline: `${token("focus-ring.width").css} solid ${token("color.border.focus", th).css}`,
            outlineOffset: token("focus-ring.offset").css,
            height: token("size.control.md").css,
            borderRadius: token("radius.md").css,
          }}
        >
          Focused ({th})
        </button>
      </ThemeCell>
    ))}
  </div>
);

// ---------- elevation ----------

export const Shadows = () => (
  <TokenTable
    prefix="shadow"
    preview={(t, theme) => (
      <div
        className="pts-card"
        style={{ boxShadow: t.css, background: token(theme === "dark" ? "color.background.subtle" : "color.background.default", theme).css }}
      />
    )}
  />
);

export const Overlay = () => (
  <div className="pts-row">
    {THEMES.map((th) => (
      <ThemeCell key={th} theme={th} style={{ position: "relative", height: 120, overflow: "hidden" }}>
        <p style={{ padding: 16 }}>Page content ({th})</p>
        <div style={{ position: "absolute", inset: 0, background: token("color.background.overlay", th).css }} />
        <div
          className="pts-card"
          style={{
            position: "absolute",
            top: 16,
            right: 24,
            width: "45%",
            height: 88,
            margin: 0,
            padding: 12,
            background: token("color.background.default", th).css,
            boxShadow: token("shadow.xl", th).css,
          }}
        >
          Modal
        </div>
      </ThemeCell>
    ))}
  </div>
);

// ---------- motion ----------

export const MotionDemo = () => (
  <table className="pts-table">
    <thead>
      <tr>
        <th>Duration \ Easing</th>
        {group("motion.easing").map((e) => (
          <th key={e.id}>
            {leaf(e.id)}
            <br />
            <span className="pts-muted">{e.display}</span>
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {group("motion.duration").map((d) => (
        <tr key={d.id}>
          <td>
            <strong>{leaf(d.id)}</strong> {d.display}
          </td>
          {group("motion.easing").map((e) => (
            <td key={e.id}>
              <div className="pts-track" title="Hover to play">
                <div className="pts-dot" style={{ transitionDuration: d.css, transitionTimingFunction: e.css }} />
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

// ---------- layers ----------

export const ZIndexStack = () => {
  const layers = group("z-index");
  return (
    <div className="pts-stack">
      {layers.map((t, i) => (
        <div key={t.id} className="pts-layer" style={{ zIndex: t.resolved, left: i * 32, top: i * 36 }}>
          {leaf(t.id)} · {t.display}
        </div>
      ))}
    </div>
  );
};
