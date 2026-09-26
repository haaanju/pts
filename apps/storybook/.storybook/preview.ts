import type { Preview } from "@storybook/react-vite";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";
import "@pts/web/fonts.css";
import "@pts/web/tokens.css";
import "../src/docs.css";
import { light, resolveMode, THEME_GLOBAL } from "./theme";

// The docs follow the theme toggle (manager.tsx) through a global. Setting data-theme on <html>
// switches every token variable; an explicit value also stops the OS color scheme from overriding it.
// The theme global is left unset by default so the saved choice can apply (see resolveMode).
const applyTheme = (globalValue: unknown) => {
  document.documentElement.dataset.theme = resolveMode(globalValue);
};
applyTheme(undefined);

const channel = addons.getChannel();
const onGlobals = ({ globals }: { globals: Record<string, unknown> }) => applyTheme(globals[THEME_GLOBAL]);
channel.on(SET_GLOBALS, onGlobals);
channel.on(GLOBALS_UPDATED, onGlobals);

const preview: Preview = {
  // Declared (so ?globals=theme:dark is accepted) but without a default or toolbar menu:
  // the toggle in manager.tsx is the UI, and an unset value falls back to the saved choice.
  globalTypes: {
    [THEME_GLOBAL]: { description: "Docs color theme (light | dark)" },
  },
  parameters: {
    docs: { theme: light },
    options: {
      storySort: {
        order: ["Overview", "Semantic", ["Color", "Typography", "Spacing", "Border", "Elevation", "Size", "Motion", "Layout"], "Primitive", ["Palette", "Scales"]],
      },
    },
  },
};

export default preview;
