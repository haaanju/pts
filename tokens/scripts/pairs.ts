// Color pairing rules (ADR 0017, 0018), derived from token names alone.
// Shared by scripts/check.ts and the Storybook docs so both test the same pairs.
// Ids are dot paths without the tier, e.g. "intent.danger.content.emphasis".

export const TEXT = 4.5; // WCAG 1.4.3
export const UI = 3; // WCAG 1.4.11
const STATES = ["hover", "pressed"];
// fills that own the hover/pressed next to them: canvas (transparent elements), inverse/base, intent emphasis
const STATE_OWNERS = ["canvas", "base", "emphasis"];
// content names that are a hierarchy level; any other content name is the background it sits on
const HIERARCHY = ["base", "muted"];
// inactive components are exempt from WCAG contrast (1.4.3, 1.4.11); subtle borders are decorative
const EXEMPT_CONTENT = ["disabled"];
const EXEMPT_BORDER = ["disabled", "subtle"];

/** True for colors that are never contrast-checked: disabled, decorative borders, utility/*, always/* */
export const isExempt = (id: string) => {
  const [head, ...rest] = id.split(".");
  if (head === "utility" || head === "always") return true;
  const path = head === "intent" ? rest.slice(1) : [head, ...rest];
  if (path[0] === "content") return path.length === 2 && EXEMPT_CONTENT.includes(path[1]);
  if (path[0] === "border") return EXEMPT_BORDER.includes(path[1]);
  return path[0] === "background" && path[1] === "disabled";
};

// Token ids under a group, relative to it: children("background", ids) → ["canvas", "surface.subtle", …]
const children = (group: string, ids: string[]) => ids.filter((id) => id.startsWith(`${group}.`)).map((id) => id.slice(group.length + 1));

// A fill and the states next to it, as full ids: withStates("intent.danger.background", "emphasis", ids)
const withStates = (group: string, name: string, ids: string[]) => {
  const own = STATE_OWNERS.includes(name) ? STATES.map((s) => `${group}.${s}`).filter((id) => ids.includes(id)) : [];
  return [`${group}.${name}`, ...own];
};

// Neutral canvas, the transparent-element states on it, and the surfaces: where page content and borders sit.
const pageBackgrounds = (ids: string[]) => [
  ...withStates("background", "canvas", ids),
  ...children("background.surface", ids).map((n) => `background.surface.${n}`),
];

// Neutral colors are one context; each intent is another with the same background/content/border shape.
const contexts = (ids: string[]) => ["", ...new Set(children("intent", ids).map((n) => `intent.${n.split(".")[0]}.`))];

// [foreground token, background token, minimum ratio]
export const contrastPairs = (ids: string[]): [string, string, number][] => {
  const page = pageBackgrounds(ids);
  const pairs: [string, string, number][] = [];
  for (const ctx of contexts(ids)) {
    const bg = `${ctx}background`;
    for (const name of children(`${ctx}content`, ids)) {
      const id = `${ctx}content.${name}`;
      if (EXEMPT_CONTENT.includes(name)) continue;
      const [first] = name.split(".");
      // content/<level> sits on the page; content/<X> and content/<X>/<level> sit on background/<X> and its states
      const targets = name.includes(".")
        ? children(`${bg}.${first}`, ids).map((n) => `${bg}.${first}.${n}`)
        : HIERARCHY.includes(name)
          ? page
          : withStates(bg, name, ids);
      // a content name with no matching background is reported as a missing pair
      for (const target of targets.length ? targets : [`${bg}.${first}`]) pairs.push([id, target, TEXT]);
    }
    for (const name of children(`${ctx}border`, ids).filter((n) => !EXEMPT_BORDER.includes(n))) {
      for (const target of page) pairs.push([`${ctx}border.${name}`, target, UI]);
    }
    // solid fills are UI boundaries: intent emphasis and the neutral inverse, with their states
    const solid = ctx ? withStates(bg, "emphasis", ids) : children(`${bg}.inverse`, ids).map((n) => `${bg}.inverse.${n}`);
    for (const fill of solid) for (const target of page) pairs.push([fill, target, UI]);
  }
  return pairs;
};

// Backgrounds that must resolve to different colors, so a state change is actually visible.
export const distinctBackgrounds = (ids: string[]): [string, string][] => {
  const pairs: [string, string][] = [];
  const groups = [...new Set(ids.filter((id) => /(^|\.)background\./.test(id)).map((id) => id.slice(0, id.lastIndexOf("."))))];
  for (const group of groups) {
    for (const owner of STATE_OWNERS.filter((n) => ids.includes(`${group}.${n}`))) {
      const states = withStates(group, owner, ids);
      for (let i = 0; i < states.length; i++) for (let j = i + 1; j < states.length; j++) pairs.push([states[i], states[j]]);
    }
  }
  // hover/pressed on transparent elements must show on every surface and differ from disabled
  const others = [...children("background.surface", ids).map((n) => `background.surface.${n}`), "background.disabled"].filter((id) => ids.includes(id));
  for (const state of STATES.map((s) => `background.${s}`).filter((id) => ids.includes(id))) {
    for (const other of others) pairs.push([state, other]);
  }
  return pairs;
};

