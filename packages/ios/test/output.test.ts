// Contract tests for the @pts/ios output (ADR 0064): every semantic color has a color set whose light and dark values
// equal the resolver's at the inputs iOS fixes, and PtsColors names each one once. The expectations come from
// Terrazzo's resolver (tokens/source.ts) and the token's own hex, written out here apart from the plugin, so a
// formatting bug in the plugin fails. The Swift is compiled by `npm run compile -w @pts/ios`, which needs Xcode.
// `npm test` builds first (pretest).
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { loadResolver } from "../../../tokens/source.ts";
import { swiftName } from "../plugin-ios.ts";
import { colors, fixed } from "../terrazzo.config.ts";

const dist = (file: string) => new URL(`../dist/Pts/${file}`, import.meta.url);
const resolver = await loadResolver();
const names = colors.map(swiftName);

// What a color set holds for a token: its hex as "0xRR" channels, its alpha as a decimal
const channel = (hex: string, at: number) => `0x${hex.slice(at, at + 2).toUpperCase()}`;
const expected = ({ hex, alpha = 1 }: { hex: string; alpha?: number }) => ({
  alpha: alpha.toFixed(3),
  blue: channel(hex, 5),
  green: channel(hex, 3),
  red: channel(hex, 1),
});

test("every semantic color, each with its own name", () => {
  assert.equal(colors.length, 60);
  assert.equal(new Set(names).size, names.length, "two tokens map to the same Swift name");
});

test("the catalog holds a color set per color, and nothing else", () => {
  const sets = readdirSync(dist("Colors.xcassets")).filter((f) => f.endsWith(".colorset"));
  assert.deepEqual(sets.sort(), names.map((n) => `${n}.colorset`).sort());
});

for (const theme of ["light", "dark"]) {
  test(`each color set's ${theme} value is the resolver's in ${theme}`, () => {
    const tokens = resolver.apply({ ...fixed, theme });
    colors.forEach((id, i) => {
      const set = JSON.parse(readFileSync(dist(`Colors.xcassets/${names[i]}.colorset/Contents.json`), "utf8"));
      const entry = set.colors.find((c: any) => (theme === "dark") === Boolean(c.appearances?.some((a: any) => a.value === "dark")));
      assert.equal(entry.color["color-space"], "srgb", id);
      assert.deepEqual(entry.color.components, expected(tokens[id].$value as any), `${id} in ${theme}`);
    });
  });
}

test("a dark value differs where the theme changes it: utility.scrim is 50% black in light, 70% in dark", () => {
  const set = JSON.parse(readFileSync(dist("Colors.xcassets/utilityScrim.colorset/Contents.json"), "utf8"));
  assert.deepEqual(set.colors.map((c: any) => c.color.components.alpha), ["0.500", "0.700"]);
});

test("PtsColors makes every color set public, by its generated asset symbol", () => {
  const swift = readFileSync(dist("PtsColors.swift"), "utf8");
  const declared = [...swift.matchAll(/^ {4}public static let (\w+) = Color\(\.(\w+)\)$/gm)];
  assert.deepEqual(declared.map((m) => m[1]), names);
  assert.ok(declared.every((m) => m[1] === m[2]), "a name differs from its asset symbol");
});
