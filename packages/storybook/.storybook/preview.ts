import type { Preview } from "@storybook/react-vite";
import "@pts/css";
import "../src/docs.css";
import theme from "./theme";

// Docs chrome is always light (Storybook's docs page is white). Dark values are shown
// explicitly in side-by-side cells, so the OS color scheme must not flip the variables.
document.documentElement.dataset.theme = "light";

const preview: Preview = {
  parameters: {
    docs: { theme },
    options: {
      storySort: {
        order: ["Overview", "Color", ["Palette", "Semantic"], "Foundations", ["Typography", "Spacing", "Border", "Elevation", "Size", "Motion", "Layout"]],
      },
    },
  },
};

export default preview;
