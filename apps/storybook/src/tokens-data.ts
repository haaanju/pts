// The shape of the token data the docs read: made by a Terrazzo build in scripts/docs-tokens.ts and imported as
// "virtual:pts-tokens" (ADR 0038). Types only, so the browser code and the Node build share them.

export interface DocsToken {
  id: string;
  type: string;
  /** $description: when to use the token (every semantic token has one; primitives don't) */
  description?: string;
  /** the folder of its file: primitive, semantic, or component */
  tier: string;
}

export interface DocsValue {
  /** the value Terrazzo resolved (aliases replaced, including inside composites) */
  value: any;
  /** direct alias target, if the token is an alias */
  alias?: string;
}

export interface DocsTokens {
  /** every token, in the docs' order */
  tokens: DocsToken[];
  /**
   * each token's value per permutation, keyed "theme/density/viewport", e.g. "dark/relaxed/narrow"; a token one context
   * lacks has no entry there
   */
  values: Record<string, Record<string, DocsValue>>;
}
