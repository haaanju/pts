import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";

// Dark theme applies when the OS prefers dark (unless data-theme="light" forces light),
// or when data-theme="dark" is set explicitly. Only color tokens change between themes.
const darkOnly = ["color.**"];

export default defineConfig({
  tokens: ["../tokens/src/pts.resolver.json"],
  outDir: "./dist/",
  plugins: [
    css({
      filename: "tokens.css",
      legacyHex: true,
      permutations: [
        {
          input: { theme: "light" },
          prepare: (contents) => `:root {\n  ${contents}\n}`,
        },
        {
          input: { theme: "dark" },
          include: darkOnly,
          prepare: (contents) =>
            `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n    ${contents}\n  }\n}`,
        },
        {
          input: { theme: "dark" },
          include: darkOnly,
          prepare: (contents) => `[data-theme="dark"] {\n  ${contents}\n}`,
        },
      ],
    }),
  ],
});
