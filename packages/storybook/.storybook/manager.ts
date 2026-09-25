import { addons } from "storybook/manager-api";
import theme from "./theme";

// Docs-only Storybook: the canvas toolbar (zoom, backgrounds, measure) has nothing to act on.
addons.setConfig({ theme, showToolbar: false });
