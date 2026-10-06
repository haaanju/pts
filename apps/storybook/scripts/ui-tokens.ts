// Resolves the values the Storybook UI themes need (.storybook/ui-tokens.ts) with Terrazzo, for main.ts to write into
// the manager's and the preview's <head> at startup (ADR 0046). A listed id that isn't a token stops Storybook.
import { loadResolver, permutations } from "../../../tokens/source.ts";
import { UI_COLORS, type UiTokens } from "../.storybook/ui-tokens.ts";

const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|emoji|math|fangsong|ui-[a-z]+)$/;
const stack = (families: string[]) => families.map((f) => (GENERIC.test(f) ? f : `"${f}"`)).join(", ");

export const uiTokens = async (): Promise<UiTokens> => {
  const all = permutations(await loadResolver());
  // Colors, font families, and radii change with no modifier but the theme, so any permutation of a theme will do
  const value = (theme: "light" | "dark", id: string) => {
    const token = all.find((p) => p.input.theme === theme)?.tokens?.[id];
    if (!token) throw new Error(`${id} is not a token in the ${theme} theme (.storybook/ui-tokens.ts)`);
    return token.$value;
  };
  const colors = (theme: "light" | "dark") =>
    Object.fromEntries(UI_COLORS.map((id) => [id, (value(theme, id) as { hex: string }).hex])) as UiTokens["light"];
  return {
    light: colors("light"),
    dark: colors("dark"),
    "font-family.sans": stack(value("light", "font-family.sans") as string[]),
    "font-family.mono": stack(value("light", "font-family.mono") as string[]),
    "radius.md": (value("light", "radius.md") as { value: number }).value,
  };
};

// An inline <script> in <head> runs before the deferred module bundles that read the global
export const uiTokensScript = async () => `<script>window.PTS_UI_TOKENS = ${JSON.stringify(await uiTokens())};</script>`;
