import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";

export default defineConfig({
  tokens: [
    "../tokens/src/primitive.tokens.json",
    "../tokens/src/semantic/spacing.tokens.json",
    "../tokens/src/semantic/border.tokens.json",
  ],
  outDir: "./dist/",
  plugins: [
    css({
      filename: "tokens.css",
    }),
  ],
});
