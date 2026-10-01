// Docs density (ADR 0025), the same pattern as the color theme in theme.ts: a global set by the toolbar toggle,
// saved in localStorage, and ?globals=density:compact in the URL. The preview sets data-density on <html>.

export const DENSITY_GLOBAL = "density";
export const DENSITY_STORAGE_KEY = "pts-docs-density";
export type Density = "relaxed" | "compact";

const asDensity = (value: unknown): Density | null => (value === "relaxed" || value === "compact" ? value : null);

/** The density the user last picked with the toggle, or null. Shared by manager and preview (same origin). */
const readSaved = (): Density | null => {
  try {
    return asDensity(localStorage.getItem(DENSITY_STORAGE_KEY));
  } catch {
    return null;
  }
};

export const saveDensity = (density: Density) => {
  try {
    localStorage.setItem(DENSITY_STORAGE_KEY, density);
  } catch {
    // storage unavailable: the toggle still works for this session
  }
};

/** Explicit global (toggle or ?globals=density:…) wins, then the saved choice, then relaxed (the token default). */
export const resolveDensity = (globalValue: unknown): Density => asDensity(globalValue) ?? readSaved() ?? "relaxed";
