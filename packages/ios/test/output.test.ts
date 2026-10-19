// Contract tests for the @pts/ios output (ADR 0064, 0066): every semantic color has a color set whose light and dark
// values equal the resolver's at the inputs iOS fixes, and PtsColors names each one once; every text style is in
// PtsTypography at Apple's size for its iOS text style, with its family, weight, and tracking, and its font is bundled;
// every border token is in PtsBorder in points, and PtsShape follows radius/control and radius/container (ADR 0067). The expectations come from
// Terrazzo's resolver (tokens/source.ts) and the token's own hex, written out here apart from the plugin, so a
// formatting bug in the plugin fails. The Swift is compiled by `npm run compile -w @pts/ios`, which needs Xcode.
// `npm test` builds first (pretest).
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { loadResolver } from "../../../tokens/source.ts";
import { swiftName } from "../plugin-ios.ts";
import { colors, dimensions, families, fixed, key, text } from "../terrazzo.config.ts";

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

test("PtsCatalog lists every color with its path, alias and hex per theme, and this version (the demo's pages)", () => {
  const catalog = readFileSync(new URL("../dist/catalog/PtsCatalog.swift", import.meta.url), "utf8");
  const [light, dark] = ["light", "dark"].map((theme) => resolver.apply({ ...fixed, theme }));
  const hex = ({ hex, alpha = 1 }: any) => `${hex.toUpperCase()}${alpha < 1 ? ` · ${Math.round(alpha * 100)}%` : ""}`;
  colors.forEach((id, i) => {
    const pair = (a: string, b: string) => `[${JSON.stringify(a)}, ${JSON.stringify(b)}]`;
    const alias = (t: typeof light) => (t[id].aliasChain?.[0] ?? "").replaceAll(".", "/");
    const line = catalog.split("\n").find((l) => l.trim().startsWith(`Entry(path: ${JSON.stringify(id.replaceAll(".", "/"))},`));
    assert.ok(line, `${id} is missing`);
    assert.ok(line.includes(`aliases: ${pair(alias(light), alias(dark))}, hex: ${pair(hex(light[id].$value), hex(dark[id].$value))}, color: PtsColors.${names[i]})`), line.trim());
  });
  const version = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
  assert.ok(catalog.includes(`public static let version = "${version}"`));
});

test("PtsColors makes every color set public, by its generated asset symbol", () => {
  const swift = readFileSync(dist("PtsColors.swift"), "utf8");
  const declared = [...swift.matchAll(/^ {4}public static let (\w+) = Color\(\.(\w+)\)$/gm)];
  assert.deepEqual(declared.map((m) => m[1]), names);
  assert.ok(declared.every((m) => m[1] === m[2]), "a name differs from its asset symbol");
});

// Apple's text styles at the default text size (Large), from the Human Interface Guidelines' type tables
const apple: Record<string, number> = { largeTitle: 34, title: 28, title2: 22, title3: 20, headline: 17, body: 17, callout: 16, subheadline: 15, footnote: 13, caption: 12, caption2: 11 };

test("PtsTypography holds every text style at Apple's size for its iOS text style, with its family, weight, and tracking", () => {
  const swift = readFileSync(dist("PtsTypography.swift"), "utf8");
  const tokens = resolver.apply({ ...fixed, theme: "light" });
  const declared = [...swift.matchAll(/^ {4}public static let (\w+) = PtsTextStyle\((.+)\)$/gm)];
  assert.deepEqual(declared.map((m) => m[1]), text.map((id) => swiftName(id.slice("text.".length))));
  text.forEach((id, i) => {
    const t = tokens[id] as any;
    const style = t.$extensions[key].ios.textStyle;
    const size = apple[style];
    const tracking = Math.round((t.$value.letterSpacing.value / t.$value.fontSize.value) * size * 100) / 100;
    const family = (families as Record<string, string>)[t.$value.fontFamily[0]];
    assert.equal(declared[i][2], `family: "${family}", size: ${size}, textStyle: .${style}, weight: ${t.$value.fontWeight}, tracking: ${tracking}`, id);
  });
});

test("a display style keeps its letter spacing's share of the size: display-lg is -1.25px at 64px, -0.66pt at 34pt", () => {
  const swift = readFileSync(dist("PtsTypography.swift"), "utf8");
  assert.match(swift, /displayLg = PtsTextStyle\(family: "Aspekta Variable", size: 34, textStyle: \.largeTitle, weight: 700, tracking: -0\.66\)/);
});

test("every family the text styles use is bundled, with its license", () => {
  const tokens = resolver.apply({ ...fixed, theme: "light" });
  const used = new Set(text.map((id) => (tokens[id]!.$value as any).fontFamily[0]));
  const files: Record<string, string> = { Aspekta: "aspekta.ttf", "IBM Plex Mono": "ibm_plex_mono_regular.ttf", "IBM Plex Serif": "ibm_plex_serif_regular.ttf" };
  for (const family of used) {
    assert.ok(family in families, `${family} has no registered name`);
    const ttf = readFileSync(dist(`Fonts/${files[family]}`));
    assert.equal(ttf.readUInt32BE(0), 0x00010000, `${files[family]} is not TrueType`);
  }
  for (const dir of ["aspekta", "ibm-plex-mono", "ibm-plex-serif"]) assert.ok(existsSync(new URL(`../dist/licenses/${dir}-LICENSE.txt`, import.meta.url)), `${dir} license`);
});

test("PtsCatalog lists every text style, by its PtsTypography name", () => {
  const catalog = readFileSync(new URL("../dist/catalog/PtsCatalog.swift", import.meta.url), "utf8");
  for (const id of text) {
    const line = catalog.split("\n").find((l) => l.trim().startsWith(`TypeEntry(path: ${JSON.stringify(id.replaceAll(".", "/"))},`));
    assert.ok(line?.trim().endsWith(`style: PtsTypography.${swiftName(id.slice("text.".length))}),`), `${id}: ${line?.trim()}`);
  }
});

test("the dimension groups cover every semantic border token", () => {
  assert.deepEqual(Object.fromEntries(dimensions.map((g) => [g.className, g.include.length])), { PtsBorder: 15 });
});

for (const group of dimensions) {
  test(`${group.className} holds every token once, in points, as the resolver resolves it at the fixed inputs`, () => {
    const swift = readFileSync(dist(`${group.className}.swift`), "utf8");
    const tokens = resolver.apply({ ...fixed, theme: "light" });
    const declared = [...swift.matchAll(/^ {4}public static let (\w+): CGFloat = (.+)$/gm)].map((m) => [m[1], m[2]]);
    assert.deepEqual(declared, group.include.map((id) => [swiftName(id), String((tokens[id]!.$value as any).value)]));
  });
}

test("PtsShape: controls are capsules (radius/control is radius/full at shape round), containers concentric with radius/container as the minimum", () => {
  const swift = readFileSync(dist("PtsShape.swift"), "utf8");
  assert.match(swift, /public static var control: ButtonBorderShape \{ \.capsule \}/);
  assert.match(swift, /ConcentricRectangle\(corners: \.concentric\(minimum: \.fixed\(PtsBorder\.radiusContainer\)\), isUniform: true\)/);
  assert.match(readFileSync(dist("PtsBorder.swift"), "utf8"), /public static let radiusContainer: CGFloat = 32$/m);
});

test("PtsCatalog lists every dimension with its path and alias, by its constant", () => {
  const catalog = readFileSync(new URL("../dist/catalog/PtsCatalog.swift", import.meta.url), "utf8");
  const tokens = resolver.apply({ ...fixed, theme: "light" });
  for (const group of dimensions) {
    for (const id of group.include) {
      const alias = (tokens[id]!.aliasChain?.[0] ?? "").replaceAll(".", "/");
      const line = catalog.split("\n").find((l) => l.trim().startsWith(`DimensionEntry(path: ${JSON.stringify(id.replaceAll(".", "/"))},`));
      assert.ok(line?.trim().endsWith(`alias: ${JSON.stringify(alias)}, value: ${group.className}.${swiftName(id)}),`), `${id}: ${line?.trim()}`);
    }
  }
});
