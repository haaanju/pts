// Token values the Storybook UI themes (theme.ts) copy, since the manager can't read CSS variables. Keyed by token id;
// `npm test` checks each against the tokens in its theme (scripts/token-copies.test.ts). A color is its hex, a font
// family its first name, a dimension its px number.
export const copies = {
  light: {
    background: "#FFFFFF",
    "surface.subtle": "#F8F8F8",
    "border.subtle": "#E8E8E8",
    "content.base": "#181818",
    "content.subtle": "#666666",
  },
  dark: {
    background: "#181818",
    "surface.subtle": "#242424",
    "border.subtle": "#404040",
    "content.base": "#F8F8F8",
    "content.subtle": "#BABABA",
    "color.neutral.800": "#404040",
  },
  any: {
    "font-family.sans": "Aspekta",
    "font-family.mono": "IBM Plex Mono",
    "radius.md": 8,
  },
} as const;
