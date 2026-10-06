import { create } from "storybook/theming";
import type { UiTokens } from "./ui-tokens";

// Storybook UI themes, from token values main.ts resolves at startup (ui-tokens.ts), since the manager can't read CSS
// variables.

declare global {
  interface Window {
    PTS_UI_TOKENS: UiTokens;
  }
}

export const THEME_GLOBAL = "theme";
export const STORAGE_KEY = "pts-docs-theme";
export type Mode = "light" | "dark";

const asMode = (value: unknown): Mode | null => (value === "dark" || value === "light" ? value : null);

/** The mode the user last picked with the toggle, or null. Shared by manager and preview (same origin). */
export const readSaved = (): Mode | null => {
  try {
    return asMode(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

export const saveMode = (mode: Mode) => {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // storage unavailable: the toggle still works for this session
  }
};

/** Explicit global (toggle or ?globals=theme:…) wins, then the saved choice, then light. */
export const resolveMode = (globalValue: unknown): Mode => asMode(globalValue) ?? readSaved() ?? "light";

const { light: l, dark: d, ...any } = window.PTS_UI_TOKENS;

const shared = {
  brandTitle: "Plain",
  brandTarget: "_self",
  fontBase: any["font-family.sans"],
  fontCode: any["font-family.mono"],
  appBorderRadius: any["radius.md"],
  inputBorderRadius: any["radius.md"],
};

export const light = create({
  ...shared,
  base: "light",
  colorPrimary: l["content.base"],
  colorSecondary: l["content.base"],
  appBg: l["surface.subtle"],
  appContentBg: l.background,
  appPreviewBg: l.background,
  appBorderColor: l["border.subtle"],
  textColor: l["content.base"],
  textMutedColor: l["content.subtle"],
  textInverseColor: l.background,
  barBg: l.background,
  barTextColor: l["content.subtle"],
  barSelectedColor: l["content.base"],
  barHoverColor: l["content.base"],
  inputBg: l.background,
  inputBorder: l["border.subtle"],
  inputTextColor: l["content.base"],
});

export const dark = create({
  ...shared,
  base: "dark",
  // Storybook draws selected sidebar items with white text on colorSecondary,
  // so dark uses neutral.800 (#404040, 10.4:1 with white) instead of a light fill.
  colorPrimary: d["content.base"],
  colorSecondary: d["color.neutral.800"],
  appBg: d["surface.subtle"],
  appContentBg: d.background,
  appPreviewBg: d.background,
  appBorderColor: d["border.subtle"],
  textColor: d["content.base"],
  textMutedColor: d["content.subtle"],
  textInverseColor: d.background,
  barBg: d.background,
  barTextColor: d["content.subtle"],
  barSelectedColor: d["content.base"],
  barHoverColor: d["content.base"],
  inputBg: d.background,
  inputBorder: d["border.subtle"],
  inputTextColor: d["content.base"],
});

export const themeFor = (mode: Mode) => (mode === "dark" ? dark : light);
