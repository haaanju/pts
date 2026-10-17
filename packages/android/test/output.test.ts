// Contract tests for the @pts/android output (ADR 0056): dist/PtsColors.kt holds every semantic color as a property,
// and one value per theme context whose colors equal the resolver's for that theme. The expectations come from
// Terrazzo's resolver (tokens/source.ts), not from a snapshot, so a token change needs no test change, but a theme,
// token, or value the build drops or gets wrong fails. Kotlin isn't compiled here: that comes with the Compose app.
// `npm test` builds first (pretest).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { files, loadResolver } from "../../../tokens/source.ts";
import { kotlinName } from "../plugin-compose.ts";

const kt = readFileSync(new URL("../dist/PtsColors.kt", import.meta.url), "utf8");
const resolver = await loadResolver();
const themes = Object.keys(resolver.source.modifiers?.theme?.contexts ?? {});
const defaults = resolver.apply({});
const semanticColors = [...new Set(files(resolver).filter((f) => f.tier === "semantic").flatMap((f) => Object.keys(f.tokens)))].filter(
  (id) => defaults[id]?.$type === "color",
);

// The expected Kotlin, worked out apart from the plugin: the token's own hex (pts/color-hex keeps it equal to its
// components) with its alpha in front
const expected = (value: unknown) => {
  const { hex, alpha = 1 } = value as { hex: string; alpha?: number };
  const argb = `${Math.round(alpha * 255).toString(16).padStart(2, "0")}${hex.slice(1)}`.toUpperCase();
  return `Color(0x${argb})`;
};

// "val name: Color," in the class header
const declared = [...kt.slice(0, kt.indexOf("companion object")).matchAll(/^\s+val (\w+): Color,$/gm)].map((m) => m[1]);
// "val Light = PtsColors(" ... ")" with "name = Color(0x...)," lines
const values = (context: string) => {
  const name = context[0].toUpperCase() + context.slice(1);
  const block = kt.match(new RegExp(`val ${name} = PtsColors\\(([\\s\\S]*?)\\n {8}\\)`))?.[1];
  assert.ok(block, `PtsColors.${name} is missing`);
  return Object.fromEntries([...block.matchAll(/(\w+) = (Color\(0x[0-9A-F]{8}\))/g)].map((m) => [m[1], m[2]]));
};

test("there is a theme modifier with contexts to write", () => {
  assert.ok(themes.length >= 2, `theme contexts: ${themes.join(", ")}`);
});

test("PtsColors declares every semantic color once, and nothing else", () => {
  const expected = semanticColors.map(kotlinName);
  assert.equal(new Set(expected).size, expected.length, "two tokens map to the same Kotlin name");
  assert.deepEqual(declared, expected);
});

for (const theme of themes) {
  test(`PtsColors.${theme[0].toUpperCase() + theme.slice(1)} holds every semantic color as the resolver resolves it in ${theme}`, () => {
    const tokens = resolver.apply({ theme });
    const got = values(theme);
    for (const id of semanticColors) assert.equal(got[kotlinName(id)], expected(tokens[id].$value), `${id} in ${theme}`);
    assert.equal(Object.keys(got).length, semanticColors.length, `PtsColors.${theme} has extra values`);
  });
}

test("a color with alpha keeps it: utility.scrim is black at 70% in dark", () => {
  assert.equal(values("dark")[kotlinName("utility.scrim")], "Color(0xB3000000)");
});
