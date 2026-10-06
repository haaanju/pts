// The token values the Storybook UI themes (theme.ts) need as plain values, since the manager can't read CSS variables.
// main.ts resolves them with Terrazzo at startup (scripts/ui-tokens.ts) and writes them into the manager's and the
// preview's <head> as window.PTS_UI_TOKENS, so a restart picks up any token change (ADR 0046).
export const UI_COLORS = ["background", "surface.subtle", "border.subtle", "content.base", "content.subtle", "color.neutral.800"] as const;

export type UiTokens = {
  light: Record<(typeof UI_COLORS)[number], string>;
  dark: Record<(typeof UI_COLORS)[number], string>;
  "font-family.sans": string; // a CSS font stack
  "font-family.mono": string;
  "radius.md": number; // px
};
