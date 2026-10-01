import { CollapseIcon, ExpandIcon, MoonIcon, SunIcon } from "@storybook/icons";
// The manager is compiled with the classic JSX runtime, so React must be in scope.
import React, { useEffect } from "react";
import { IconButton } from "storybook/internal/components";
import { addons, types, useGlobals, useStorybookApi } from "storybook/manager-api";
import { DENSITY_GLOBAL, resolveDensity, saveDensity, type Density } from "./density";
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

// Density toggle (ADR 0025): switches the docs between relaxed and compact through a global, like the theme.
const DensityToggle = () => {
  const [globals, updateGlobals] = useGlobals();
  const density = resolveDensity(globals[DENSITY_GLOBAL]);
  const next: Density = density === "compact" ? "relaxed" : "compact";
  const toggle = () => {
    saveDensity(next);
    updateGlobals({ [DENSITY_GLOBAL]: next });
  };
  return (
    <IconButton key={`${ADDON_ID}/density`} title={`Switch to ${next} density`} aria-label={`Switch to ${next} density`} onClick={toggle}>
      {density === "compact" ? <ExpandIcon /> : <CollapseIcon />}
    </IconButton>
  );
};

addons.register(ADDON_ID, () => {
  addons.add(`${ADDON_ID}/density`, {
    type: types.TOOLEXTRA,
    title: "Density",
    match: () => true,
    render: DensityToggle,
  });
  addons.add(`${ADDON_ID}/toggle`, {
    type: types.TOOLEXTRA,
    title: "Color theme",
    match: () => true,
    render: ThemeToggle,
  });
});
