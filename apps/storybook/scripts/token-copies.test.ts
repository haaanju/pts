// The Storybook UI themes copy token values (.storybook/token-copies.ts), since the manager can't read CSS variables.
// This checks each copy against the tokens as Terrazzo resolves them, so a token change that leaves the UI behind
// fails `npm test` instead of drifting unnoticed.
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadResolver, permutations } from "../../../tokens/source.ts";
import { copies } from "../.storybook/token-copies.ts";

const all = permutations(await loadResolver());

// What a copy holds: a color's hex, a font stack's first family, a px dimension's number
const copied = (value: unknown): unknown => {
  if (Array.isArray(value)) return value[0];
  if (value && typeof value === "object" && "hex" in value) return String(value.hex).toUpperCase();
  if (value && typeof value === "object" && "value" in value) return value.value;
  return value;
};

for (const theme of ["light", "dark"] as const) {
  test(`token copies match the ${theme} theme`, () => {
    // The first permutation of the theme: copies hold only colors, fonts, and radii, which no other modifier changes
    const tokens = all.find((p) => p.input.theme === theme)?.tokens;
    assert.ok(tokens, `no ${theme} permutation`);
    const wrong: string[] = [];
    for (const [id, value] of Object.entries({ ...copies.any, ...copies[theme] })) {
      if (!tokens[id]) wrong.push(`${id} is not a token`);
      else if (copied(tokens[id].$value) !== value) wrong.push(`${id} is ${String(copied(tokens[id].$value))}, copied as ${value}`);
    }
    assert.deepEqual(wrong, [], `.storybook/token-copies.ts, ${theme}`);
  });
}
