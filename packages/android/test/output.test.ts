// Contract tests for the @pts/android output (ADR 0056, 0059): each generated class declares every token of its group
// once, and holds one value per context of its modifier, equal to the resolver's value for that context. The
// expectations come from Terrazzo's resolver (tokens/source.ts) and are written out here apart from the plugin, so a
// formatting bug in the plugin fails. The Kotlin is compiled in CI's android job (ADR 0058), not here.
// `npm test` builds first (pretest).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { loadResolver } from "../../../tokens/source.ts";
import { families } from "../fonts.ts";
import { kotlinName } from "../plugin-compose.ts";
import { groups } from "../terrazzo.config.ts";

const dist = (file: string) => new URL(`../dist/${file}`, import.meta.url);
const resolver = await loadResolver();
const pascal = (s: string) => s[0].toUpperCase() + s.slice(1);
const n = (x: number) => {
  const s = String(Math.round(x * 1000) / 1000);
  return x < 0 ? `(${s})` : s;
};

// What each kind of token should read as in Kotlin
const expected: Record<string, (value: any) => string> = {
  color: ({ hex, alpha = 1 }) => `Color(0x${`${Math.round(alpha * 255).toString(16).padStart(2, "0")}${hex.slice(1)}`.toUpperCase()})`,
  dp: ({ value }) => `${n(value)}.dp`,
  textStyle: (t) => {
    const family = families.find((f) => f.family === t.fontFamily[0])!.property;
    return `TextStyle(fontFamily = PtsFonts.${family}, fontWeight = FontWeight(${t.fontWeight}), fontSize = ${n(t.fontSize.value)}.sp, lineHeight = ${n(t.fontSize.value * t.lineHeight)}.sp, letterSpacing = ${n(t.letterSpacing.value)}.sp)`;
  },
};

test("the groups cover every semantic color, spacing, border, and text style", () => {
  const count = Object.fromEntries(groups.map((g) => [g.className, g.include.length]));
  assert.deepEqual(count, { PtsColors: 60, PtsSpacing: 34, PtsBorder: 15, PtsTypography: 13 });
});

for (const group of groups) {
  const kt = readFileSync(dist(group.filename), "utf8");
  const contexts = Object.keys(resolver.source.modifiers?.[group.modifier]?.contexts ?? {});
  const names = group.include.map((id) => kotlinName(id, group.dropPrefix));

  test(`${group.className} declares every token once, and nothing else`, () => {
    assert.equal(new Set(names).size, names.length, "two tokens map to the same Kotlin name");
    const declared = [...kt.slice(0, kt.indexOf("companion object")).matchAll(/^\s+val (\w+): \w+,$/gm)].map((m) => m[1]);
    assert.deepEqual(declared, names);
  });

  for (const context of contexts) {
    test(`${group.className}.${pascal(context)} holds every value as the resolver resolves it in ${context}`, () => {
      const block = kt.match(new RegExp(`val ${pascal(context)} = ${group.className}\\(([\\s\\S]*?)\\n {8}\\)`))?.[1];
      assert.ok(block, `${group.className}.${pascal(context)} is missing`);
      const got = Object.fromEntries(block.split("\n").map((l) => l.trim().match(/^(\w+) = (.+),$/)).filter(Boolean).map((m) => [m![1], m![2]]));
      const tokens = resolver.apply({ [group.modifier]: context });
      group.include.forEach((id, i) => assert.equal(got[names[i]], expected[group.kind](tokens[id].$value), `${id} in ${context}`));
      assert.equal(Object.keys(got).length, names.length, `extra values in ${context}`);
    });
  }

  test(`no description in ${group.filename} opens or closes a comment inside its KDoc (Kotlin nests block comments)`, () => {
    for (const line of kt.split("\n").filter((l) => l.trimStart().startsWith("/**"))) {
      const inner = line.trim().slice(3, -2);
      assert.ok(!inner.includes("/*") && !inner.includes("*/"), line.trim());
    }
  });
}

test("a value per modifier context: the colors follow the theme, spacing the density, borders the shape, type the viewport", () => {
  const value = (file: string, ctx: string, name: string) =>
    readFileSync(dist(file), "utf8").match(new RegExp(`val ${ctx} = [\\s\\S]*?\\n {12}${name} = (.+),`))![1];
  assert.equal(value("PtsColors.kt", "Dark", "utilityScrim"), "Color(0xB3000000)");
  assert.equal(value("PtsSpacing.kt", "Compact", "paddingMd"), "8.dp");
  assert.equal(value("PtsBorder.kt", "Round", "radiusControl"), "9999.dp");
  assert.match(value("PtsTypography.kt", "Wide", "displayLg"), /fontSize = 104\.sp/);
});

test("PtsFonts has a family for every font the text styles use, and every font file exists", () => {
  const fonts = readFileSync(dist("PtsFonts.kt"), "utf8");
  for (const f of families) {
    assert.match(fonts, new RegExp(`val ${f.property} = FontFamily\\(`));
    for (const file of f.files) {
      assert.ok(fonts.includes(`R.font.${file.res}`), `${f.property} misses ${file.res}`);
      const ttf = readFileSync(dist(`res/font/${file.res}.ttf`));
      assert.equal(ttf.readUInt32BE(0), 0x00010000, `${file.res}.ttf is not TrueType`);
    }
  }
  for (const dir of ["aspekta", "ibm-plex-mono", "ibm-plex-serif"]) assert.ok(existsSync(dist(`licenses/${dir}-LICENSE.txt`)), `${dir} license`);
});
