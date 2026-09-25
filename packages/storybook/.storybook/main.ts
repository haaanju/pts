import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx"],
  addons: ["@storybook/addon-docs"],
  // Serves the @pts/fonts files to the Storybook UI (manager-head.html); the docs import @pts/fonts directly.
  staticDirs: [{ from: "../../fonts/files", to: "/fonts" }],
  framework: { name: "@storybook/react-vite", options: {} },
  // Token docs only: no component onboarding and no canvas tools (the toolbar keeps the theme toggle).
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
