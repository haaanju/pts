import { CircleHollowIcon, CollapseIcon, ExpandIcon, MoonIcon, StopAltHollowIcon, SunIcon } from "@storybook/icons";
// The manager is compiled with the classic JSX runtime, so React must be in scope.
import React, { useEffect, type ReactNode } from "react";
import { IconButton } from "storybook/internal/components";
import { addons, types, useGlobals, useStorybookApi } from "storybook/manager-api";
import { density, shape, type AttributeMode } from "./attributes";
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

// Density and shape toggles (ADR 0025, 0048): switch the docs between the two contexts of an attribute modifier through
// a global, like the theme. The icon shows the context a click switches to.
const attributeToggle =
  <Context extends string>(mode: AttributeMode<Context>, icons: Record<Context, ReactNode>) =>
  () => {
    const [globals, updateGlobals] = useGlobals();
    const next = mode.next(mode.resolve(globals[mode.global]));
    const toggle = () => {
      mode.save(next);
      updateGlobals({ [mode.global]: next });
    };
    const title = `Switch to ${next} ${mode.global}`;
    return (
      <IconButton key={`${ADDON_ID}/${mode.global}`} title={title} aria-label={title} onClick={toggle}>
        {icons[next]}
      </IconButton>
    );
  };

const DensityToggle = attributeToggle(density, { relaxed: <ExpandIcon />, compact: <CollapseIcon /> });
const ShapeToggle = attributeToggle(shape, { round: <CircleHollowIcon />, soft: <StopAltHollowIcon /> });

addons.register(ADDON_ID, () => {
  addons.add(`${ADDON_ID}/shape`, {
    type: types.TOOLEXTRA,
    title: "Shape",
    match: () => true,
    render: ShapeToggle,
  });
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
