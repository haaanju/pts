import { MoonIcon, SunIcon } from "@storybook/icons";
// The manager is compiled with the classic JSX runtime, so React must be in scope.
import React, { useEffect } from "react";
import { IconButton } from "storybook/internal/components";
import { addons, types, useGlobals, useStorybookApi } from "storybook/manager-api";
import { resolveMode, saveMode, THEME_GLOBAL, themeFor, type Mode } from "./theme";

const ADDON_ID = "pts/theme";

addons.setConfig({ theme: themeFor(resolveMode(undefined)) });

const ThemeToggle = () => {
  const [globals, updateGlobals] = useGlobals();
  const api = useStorybookApi();
  const mode = resolveMode(globals[THEME_GLOBAL]);

  useEffect(() => {
    api.setOptions({ theme: themeFor(mode) });
  }, [api, mode]);

  const next: Mode = mode === "dark" ? "light" : "dark";
  const toggle = () => {
    saveMode(next);
    updateGlobals({ [THEME_GLOBAL]: next });
  };

  return (
    <IconButton key={ADDON_ID} title={`Switch to ${next} mode`} aria-label={`Switch to ${next} mode`} onClick={toggle}>
      {mode === "dark" ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
};

addons.register(ADDON_ID, () => {
  addons.add(`${ADDON_ID}/toggle`, {
    type: types.TOOLEXTRA,
    title: "Color theme",
    match: () => true,
    render: ThemeToggle,
  });
});
