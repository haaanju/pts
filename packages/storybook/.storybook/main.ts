import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx"],
  addons: ["@storybook/addon-docs"],
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
