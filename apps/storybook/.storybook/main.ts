import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.tsx"],
  // addon-a11y: an Accessibility panel on stories while developing. Docs pages are checked by scripts/a11y.ts (ADR 0036).
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  // Serves the @pts/web font files to the Storybook UI (manager-head.html); the docs import @pts/web/fonts.css directly.
  staticDirs: [{ from: "../../../packages/web/fonts", to: "/fonts" }],
  framework: { name: "@storybook/react-vite", options: {} },
  // Docs first: no component onboarding and no canvas tools (the toolbar keeps the theme toggle).
  features: {
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
    backgrounds: false,
    measure: false,
    outline: false,
    viewport: false,
  },
  core: { disableWhatsNewNotifications: true },
};

export default config;
