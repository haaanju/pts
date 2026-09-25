import { create } from "storybook/theming";

// Storybook UI theme. Hex values mirror PTS tokens (the manager can't read CSS variables):
// neutral.950 #181818, neutral.50 #F8F8F8, neutral.200 #E8E8E8, neutral.700 #666666.
export default create({
  base: "light",
  brandTitle: "PTS — Personal Token System",
  brandTarget: "_self",

  fontBase: '"IBM Plex Sans", system-ui, sans-serif',
  fontCode: '"IBM Plex Mono", ui-monospace, monospace',

  colorPrimary: "#181818",
  colorSecondary: "#181818",

  appBg: "#F8F8F8",
  appContentBg: "#FFFFFF",
  appPreviewBg: "#FFFFFF",
  appBorderColor: "#E8E8E8",
  appBorderRadius: 8,

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
  inputBorderRadius: 8,
});
