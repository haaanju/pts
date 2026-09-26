import { create } from "storybook/theming";

// Storybook UI themes. Hex values mirror PTS tokens (the manager can't read CSS variables).
// Update them if these tokens change.

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

const shared = {
  brandTitle: "Plain",
  brandTarget: "_self",
  fontBase: '"Aspekta", system-ui, sans-serif', // font-family.sans
  fontCode: '"IBM Plex Mono", ui-monospace, monospace', // font-family.mono
  appBorderRadius: 8, // radius.md
  inputBorderRadius: 8,
};

// light: background.default #FFFFFF, background.subtle #F8F8F8, border.default #E8E8E8,
//        foreground.default #181818, foreground.muted #666666
export const light = create({
  ...shared,
  base: "light",
  colorPrimary: "#181818",
  colorSecondary: "#181818",
  appBg: "#F8F8F8",
  appContentBg: "#FFFFFF",
  appPreviewBg: "#FFFFFF",
  appBorderColor: "#E8E8E8",
  textColor: "#181818",
  textMutedColor: "#666666",
  textInverseColor: "#FFFFFF",
  barBg: "#FFFFFF",
  barTextColor: "#666666",
  barSelectedColor: "#181818",
  barHoverColor: "#181818",
  inputBg: "#FFFFFF",
  inputBorder: "#E8E8E8",
  inputTextColor: "#181818",
});

// dark: background.default #181818, background.subtle #242424, border.default #404040,
//       foreground.default #F8F8F8, foreground.muted #BABABA
export const dark = create({
  ...shared,
  base: "dark",
  // Storybook draws selected sidebar items with white text on colorSecondary,
  // so dark uses neutral.800 (#404040, 10.4:1 with white) instead of a light fill.
  colorPrimary: "#F8F8F8",
  colorSecondary: "#404040",
  appBg: "#242424",
  appContentBg: "#181818",
  appPreviewBg: "#181818",
  appBorderColor: "#404040",
  textColor: "#F8F8F8",
  textMutedColor: "#BABABA",
  textInverseColor: "#181818",
  barBg: "#181818",
  barTextColor: "#BABABA",
  barSelectedColor: "#F8F8F8",
  barHoverColor: "#F8F8F8",
  inputBg: "#181818",
  inputBorder: "#404040",
  inputTextColor: "#F8F8F8",
});

export const themeFor = (mode: Mode) => (mode === "dark" ? dark : light);
