import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx"],
  addons: ["@storybook/addon-docs"],
  framework: { name: "@storybook/react-vite", options: {} },
  // Token docs only — no component onboarding.
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
  core: { disableWhatsNewNotifications: true },
};

export default config;
