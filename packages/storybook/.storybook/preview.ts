import type { Preview } from "@storybook/react-vite";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";
import "@pts/css";
import "../src/docs.css";
import { light, THEME_GLOBAL } from "./theme";

// The docs follow the theme toggle (manager.tsx) through a global. Setting data-theme on <html>
// switches every token variable; an explicit value also stops the OS color scheme from overriding it.
const applyTheme = (mode: unknown) => {
  document.documentElement.dataset.theme = mode === "dark" ? "dark" : "light";
};
applyTheme("light");

const channel = addons.getChannel();
const onGlobals = ({ globals }: { globals: Record<string, unknown> }) => applyTheme(globals[THEME_GLOBAL]);
channel.on(SET_GLOBALS, onGlobals);
channel.on(GLOBALS_UPDATED, onGlobals);

const preview: Preview = {
  initialGlobals: { [THEME_GLOBAL]: "light" },
  parameters: {
    docs: { theme: light },
    options: {
      storySort: {
        order: ["Overview", "Color", ["Palette", "Semantic"], "Foundations", ["Typography", "Spacing", "Border", "Elevation", "Size", "Motion", "Layout"]],
      },
    },
  },
};

export default preview;
