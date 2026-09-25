import type { Preview } from "@storybook/react-vite";
import "@pts/css";
import "../src/docs.css";

// Docs chrome is always light (Storybook's docs page is white). Dark values are shown
// explicitly in side-by-side cells, so the OS color scheme must not flip the variables.
document.documentElement.dataset.theme = "light";

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ["Introduction", "Color", ["Palette", "Semantic"], "Typography", "Spacing", "Border", "Elevation", "Size", "Motion", "Layout"],
      },
    },
  },
};

export default preview;
