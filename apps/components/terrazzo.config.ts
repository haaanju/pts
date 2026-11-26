// The component tier's CSS, one Lit module per component file (ADR 0079): src/<component>/<component>.tokens.ts holds
// :host { --button-primary-surface-rest: var(--inverse-base); … }, which the component adds to its shadow styles.
// Declared on the host, each reference resolves inside whatever theme, density, or shape subtree holds the component,
// so one block follows every modifier and none is repeated. The references name semantic tokens, which
// @pts/web/tokens.css declares (pts/tier-aliases keeps component aliases to the semantic tier).
// The modules are committed, so typecheck and Storybook read them from src/; `npm test` checks them against the resolver.
import { fileURLToPath } from "node:url";
import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
import { files, loadResolver, RESOLVER } from "../../tokens/source.ts";

const resolver = await loadResolver();
// A reference doesn't depend on the modifiers, so one permutation, at the defaults, writes every component
const defaults = Object.fromEntries(
  Object.entries(resolver.source.modifiers ?? {}).flatMap(([name, m]) => (m.default ? [[name, m.default]] : [])),
);

// plugin-css writes the file; prepare wraps its :host rule in a Lit css`` module, so the CSS reaches the shadow root
// without a bundler (the package builds with tsc only). plugin-css's header is a /* */ comment, valid TypeScript;
// prepare's output follows it, starting with the token file to edit instead.
export default defineConfig({
  tokens: [fileURLToPath(RESOLVER)],
  outDir: "./src/",
  plugins: files(resolver)
    .filter((file) => file.tier === "component")
    .map((file) =>
      css({
        filename: `${file.name}/${file.name}.tokens.ts`,
        include: Object.keys(file.tokens),
        permutations: [
          {
            input: defaults,
            prepare: (contents) =>
              `// Generated from tokens/src/${file.path}.\n` +
              `// To change it, edit that file and run npm run build -w @pts/components.\n\n` +
              `import { css } from "lit";\n\nexport default css\`\n:host {\n  ${contents}\n}\n\`;`,
          },
        ],
      }),
    ),
});
