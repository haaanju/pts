// Per-product outputs (ADR 0047): each product is a fixed set of resolver modifier inputs, and the build writes
// dist/products/<name>.css and <name>.js (+ .d.ts) for it. A modifier a product fixes has no blocks in its CSS and one
// context in its JS; the others stay switchable as in tokens.css. These two are example products, not real ones: they
// exist to show and test per-product outputs from one source, as the Button tests the component tier (ADR 0034).
// Read by the build config, the output test, and the Storybook docs.
export const products: Record<string, Record<string, string>> = {
  "dense-app": { density: "compact" },
  "roomy-app": { density: "relaxed" },
};
