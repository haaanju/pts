// The module the Vite plugin in scripts/docs-tokens.ts serves (ADR 0038).
declare module "virtual:pts-tokens" {
  const data: import("./tokens-data.ts").DocsTokens;
  export default data;
}
