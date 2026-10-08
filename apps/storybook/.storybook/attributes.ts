// Docs density and shape (ADR 0025, 0048), the modifiers set by an attribute on any element, in the same pattern as
// the color theme in theme.ts: a global set by the toolbar toggle, saved in localStorage, and ?globals=density:compact
// (or shape:round) in the URL. The preview sets data-density and data-shape on <html>.

export type AttributeMode<Context extends string = string> = {
  /** the global, named after the modifier */
  global: string;
  /** Explicit global (toggle or ?globals=…) wins, then the saved choice, then the token default. */
  resolve(globalValue: unknown): Context;
  /** The other context, for the two-context toggle */
  next(context: Context): Context;
  save(context: Context): void;
};

const attributeMode = <Context extends string>(global: string, contexts: readonly [Context, Context], fallback: Context): AttributeMode<Context> => {
  const storageKey = `pts-docs-${global}`;
  const asContext = (value: unknown): Context | null => (contexts.includes(value as Context) ? (value as Context) : null);

  /** The context the user last picked with the toggle, or null. Shared by manager and preview (same origin). */
  const readSaved = (): Context | null => {
    try {
      return asContext(localStorage.getItem(storageKey));
    } catch {
      return null;
    }
  };

  return {
    global,
    resolve: (globalValue) => asContext(globalValue) ?? readSaved() ?? fallback,
    next: (context) => (context === contexts[0] ? contexts[1] : contexts[0]),
    save: (context) => {
      try {
        localStorage.setItem(storageKey, context);
      } catch {
        // storage unavailable: the toggle still works for this session
      }
    },
  };
};

export const density = attributeMode("density", ["relaxed", "compact"], "relaxed");
export const shape = attributeMode("shape", ["soft", "round"], "soft");
export const ATTRIBUTE_MODES: AttributeMode[] = [density, shape];
