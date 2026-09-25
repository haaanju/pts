import { MoonIcon, SunIcon } from "@storybook/icons";
// The manager is compiled with the classic JSX runtime, so React must be in scope.
import React, { useEffect } from "react";
import { IconButton } from "storybook/internal/components";
import { addons, types, useGlobals, useStorybookApi } from "storybook/manager-api";
import { THEME_GLOBAL, themeFor, type Mode } from "./theme";

const ADDON_ID = "pts/theme";
const STORAGE_KEY = "pts-docs-theme";

/** The mode the user last picked, or null if they never toggled. */
const readSaved = (): Mode | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
};

addons.setConfig({ theme: themeFor(readSaved() ?? "light") });

const ThemeToggle = () => {
  const [globals, updateGlobals] = useGlobals();
  const api = useStorybookApi();
  const mode: Mode = globals[THEME_GLOBAL] === "dark" ? "dark" : "light";

  // Restore the saved mode once so the preview matches the manager after a reload.
  useEffect(() => {
    const saved = readSaved();
    if (saved && saved !== mode) updateGlobals({ [THEME_GLOBAL]: saved });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.setOptions({ theme: themeFor(mode) });
  }, [api, mode]);

  const next: Mode = mode === "dark" ? "light" : "dark";
  const toggle = () => {
    updateGlobals({ [THEME_GLOBAL]: next });
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable: the toggle still works for this session
    }
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
