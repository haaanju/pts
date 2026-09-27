// Color pairing rules (ADR 0019), derived from token names alone.
// Shared by scripts/check.ts and the Storybook docs so both test the same pairs.
// Ids are dot paths without the tier, e.g. "intent.danger.content.inverse".

export const TEXT = 4.5; // WCAG 1.4.3
export const UI = 3; // WCAG 1.4.11
// content names that are a level; content/inverse is text on a flipped fill; any other content name is reported
const LEVELS = ["base", "subtle"];
// the steps of a strong fill: base at rest, strong on hover, stronger when pressed
const FILL_STEPS = ["base", "strong", "stronger"];

/** True for colors that are never contrast-checked: disabled (inactive), decorative subtle borders, utility/*, always/* */
export const isExempt = (id: string) => {
  const [head, ...rest] = id.split(".");
  if (["disabled", "utility", "always"].includes(head)) return true;
  const path = head === "intent" ? rest.slice(1) : [head, ...rest];
  return path[0] === "border" && path[1] === "subtle";
};

// Token ids under a group, relative to it: children("content", ids) → ["base", "subtle", "inverse.base", …]
const children = (group: string, ids: string[]) => ids.filter((id) => id.startsWith(`${group}.`)).map((id) => id.slice(group.length + 1));
const existing = (candidates: string[], ids: string[]) => candidates.filter((id) => ids.includes(id));

// The page and the neutral surfaces: where level content and every border sit.
const pageBackgrounds = (ids: string[]) => existing(["background", ...children("surface", ids).map((n) => `surface.${n}`)], ids);

// Strong fills that flip their text, with their hover and pressed steps: the neutral inverse, and each intent's surface/base and up.
const flippedFills = (ctx: string, ids: string[]) =>
  ctx ? existing(FILL_STEPS.map((s) => `${ctx}surface.${s}`), ids) : children("inverse", ids).map((n) => `inverse.${n}`);

// Neutral colors are one context; each intent is another with the same surface/content/border shape.
const contexts = (ids: string[]) => ["", ...new Set(children("intent", ids).map((n) => `intent.${n.split(".")[0]}.`))];

// [foreground token, background token, minimum ratio]
export const contrastPairs = (ids: string[]): [string, string, number][] => {
  const page = pageBackgrounds(ids);
  const pairs: [string, string, number][] = [];
  for (const ctx of contexts(ids)) {
    const flipped = flippedFills(ctx, ids);
    for (const name of children(`${ctx}content`, ids)) {
      const id = `${ctx}content.${name}`;
      const targets =
        name === "inverse" || name.startsWith("inverse.")
          ? flipped
          : LEVELS.includes(name)
            ? // an intent's level content also sits on that intent's soft fill
              [...page, ...(ctx ? existing([`${ctx}surface.subtle`], ids) : [])]
            : [];
      // a content name that is neither a level nor inverse has no known background and is reported
      for (const target of targets.length ? targets : [`${ctx}content.${name} (no background)`]) pairs.push([id, target, TEXT]);
    }
    for (const name of children(`${ctx}border`, ids).filter((n) => n !== "subtle")) {
      for (const target of page) pairs.push([`${ctx}border.${name}`, target, UI]);
    }
    // strong fills are UI boundaries against the page
    for (const fill of flipped) for (const target of page) pairs.push([fill, target, UI]);
  }
  return pairs;
};

// Fills that must resolve to different colors, so a step or a state change is actually visible.
export const distinctBackgrounds = (ids: string[]): [string, string][] => {
  const ladders = [
    ["background", ...existing(["subtle", "strong", "stronger"].map((s) => `surface.${s}`), ids)],
    flippedFills("", ids),
    ...contexts(ids)
      .filter(Boolean)
      .map((ctx) => existing(["subtle", ...FILL_STEPS].map((s) => `${ctx}surface.${s}`), ids)),
  ];
  const pairs: [string, string][] = [];
  for (const ladder of ladders) for (let i = 0; i < ladder.length; i++) for (let j = i + 1; j < ladder.length; j++) pairs.push([ladder[i], ladder[j]]);
  // hover and pressed on transparent elements must also differ from a disabled control
  for (const state of existing(["surface.strong", "surface.stronger"], ids)) if (ids.includes("disabled.surface")) pairs.push([state, "disabled.surface"]);
  return pairs;
};
