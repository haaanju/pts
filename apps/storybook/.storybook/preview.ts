import type { Preview } from "@storybook/react-vite";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";
import "@pts/web/fonts.css";
import "@pts/web/tokens.css";
import "../src/docs.css";
import { DENSITY_GLOBAL, resolveDensity } from "./density";
import { light, resolveMode, THEME_GLOBAL } from "./theme";

// The docs follow the theme toggle (manager.tsx) through a global. Setting data-theme on <html>
// switches every token variable; an explicit value also stops the OS color scheme from overriding it.
// The theme global is left unset by default so the saved choice can apply (see resolveMode).
// Density works the same way through data-density (ADR 0025).
const applyTheme = (globalValue: unknown) => {
  document.documentElement.dataset.theme = resolveMode(globalValue);
};
const applyDensity = (globalValue: unknown) => {
  document.documentElement.dataset.density = resolveDensity(globalValue);
};
applyTheme(undefined);
applyDensity(undefined);

const channel = addons.getChannel();
const onGlobals = ({ globals }: { globals: Record<string, unknown> }) => {
  applyTheme(globals[THEME_GLOBAL]);
  applyDensity(globals[DENSITY_GLOBAL]);
};
channel.on(SET_GLOBALS, onGlobals);
channel.on(GLOBALS_UPDATED, onGlobals);

const preview: Preview = {
  // Declared (so ?globals=theme:dark is accepted) but without a default or toolbar menu:
  // the toggle in manager.tsx is the UI, and an unset value falls back to the saved choice.
  globalTypes: {
    [THEME_GLOBAL]: { description: "Docs color theme (light | dark)" },
    [DENSITY_GLOBAL]: { description: "Docs density (relaxed | compact)" },
  },
  parameters: {
    docs: { theme: light },
    options: {
      storySort: {
        order: ["Overview", "Component", ["Button"], "Semantic", ["Color", "Typography", "Spacing", "Border", "Elevation", "Size", "Motion", "Layout"], "Primitive", ["Palette", "Scales"]],
      },
    },
  },
};

export default preview;
