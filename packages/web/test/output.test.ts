// Contract tests for the @pts/web output: what dist/ must hold for every token in every mode. The expectations come
// from Terrazzo's resolver (tokens/source.ts), not from a snapshot, so a token change needs no test change, but a
// mode, token, or output the build drops fails: a new theme context with no CSS block, a modifier block that misses a
// token (or resets another modifier's), JS or SCSS without a token (sass() before css() builds an empty map).
// `npm test` builds first (pretest).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { suite, test } from "node:test";
import type { TokenNormalizedSet } from "@terrazzo/parser";
import { loadResolver, permutations } from "../../../tokens/source.ts";

const read = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), "utf8");
const cssVar = (id: string) => `--${id.replaceAll(".", "-")}`;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const resolver = await loadResolver();
const all = permutations(resolver).map(({ input, tokens }) => ({ input, tokens: tokens as TokenNormalizedSet }));
const modifiers = Object.entries(resolver.source.modifiers ?? {}).map(([name, m]) => ({
  name,
  contexts: Object.keys(m.contexts),
  default: m.default,
}));
const defaults = Object.fromEntries(modifiers.map((m) => [m.name, m.default]));
const at = (input: Record<string, string>) =>
  all.find((p) => modifiers.every((m) => p.input[m.name] === (input[m.name] ?? defaults[m.name])))!.tokens;

// What a CSS declaration says: the target of a whole-token alias, the targets of a composite's properties, or the value
const declared = (token: TokenNormalizedSet[string]) => token.aliasChain?.[0] ?? token.partialAliasOf ?? token.$value;

/**
 * Tokens a modifier changes: two permutations that differ only in it resolve them differently (resolved), or declare
 * them differently (declared). A block on a subtree must repeat the first: a variable declared on :root keeps the value
 * it had there. A block on :root itself (the viewport's media query) needs only the second, since aliases resolve again.
 */
const dependsOn = (modifier: string, by: "resolved" | "declared" = "resolved") => {
  const value = (token: TokenNormalizedSet[string] | undefined) => (token && by === "declared" ? declared(token) : token?.$value);
  const ids = new Set<string>();
  for (const p of all) {
    for (const q of all) {
      const onlyThis = modifiers.every((m) => (m.name === modifier ? p.input[m.name] !== q.input[m.name] : p.input[m.name] === q.input[m.name]));
      if (onlyThis) for (const id of Object.keys(p.tokens)) if (!same(value(p.tokens[id]), value(q.tokens[id]))) ids.add(id);
    }
  }
  return ids;
};

/** tokens.css as { "selector path": { "--name": "value" } }, nested at-rules joined with a space */
const blocks = (() => {
  const out = new Map<string, Map<string, string>>();
  const stack: string[] = [];
  for (const line of read("tokens.css")
    .split("\n")
    .map((l) => l.trim())) {
    if (line.endsWith("{")) stack.push(line.slice(0, -1).trim());
    else if (line === "}") stack.pop();
    else {
      const m = line.match(/^(--[\w-]+):\s*(.*);$/);
      if (!m) continue;
      const path = stack.join(" ");
      if (!out.has(path)) out.set(path, new Map());
      out.get(path)!.set(m[1], m[2]);
    }
  }
  return out;
})();

// Where each modifier context lives in tokens.css (ADR 0029, CLAUDE.md → Output). The viewport is the window, so its
// blocks sit on :root and the default viewport is :root itself. A context with no selector here fails the test until
// the build and this map both handle it.
const breakpoint = (id: string) => {
  const { value, unit } = at({})[id].$value as { value: number; unit: string };
  return `${value}${unit}`;
};
const selectors = (modifier: string, context: string): string[] => {
  if (modifier === "viewport") {
    if (context === defaults.viewport) return [];
    const wide: Record<string, string> = { wide: "breakpoint.md" };
    return wide[context] ? [`@media (min-width: ${breakpoint(wide[context])}) :root`] : [`(no media query for viewport=${context})`];
  }
  const attribute = `[data-${modifier}="${context}"]`;
  return modifier === "theme" && context === "dark"
    ? [attribute, '@media (prefers-color-scheme: dark) :root:not([data-theme="light"])']
    : [attribute];
};

// A whole-token alias is written as a reference to its target, so the reference shows which permutation filled a block.
// Composites are written out from their properties instead (a typography alias becomes a font shorthand).
const COMPOSITES = ["typography", "shadow", "border", "transition", "gradient"];
const expectReference = (block: Map<string, string>, tokens: TokenNormalizedSet, id: string, where: string) => {
  const target = COMPOSITES.includes(tokens[id].$type) ? undefined : tokens[id].aliasChain?.[0];
  if (target) assert.equal(block.get(cssVar(id)), `var(${cssVar(target)})`, `${where}: ${cssVar(id)} should reference ${target}`);
};

suite("@pts/web output", () => {
  test(":root declares every token at the defaults", () => {
    const root = blocks.get(":root");
    assert.ok(root, "tokens.css has no :root block");
    const tokens = at({});
    for (const id of Object.keys(tokens)) {
      assert.ok(root.has(cssVar(id)), `:root lacks ${cssVar(id)}`);
      expectReference(root, tokens, id, ":root");
    }
  });

  for (const modifier of modifiers) {
    const onRoot = modifier.name === "viewport";
    const own = dependsOn(modifier.name, onRoot ? "declared" : "resolved");
    const others = new Set(modifiers.filter((m) => m !== modifier).flatMap((m) => [...dependsOn(m.name)]));
    for (const context of modifier.contexts) {
      for (const selector of selectors(modifier.name, context)) {
        test(`${selector} holds every token ${modifier.name}=${context} changes, and no other modifier's`, () => {
          const block = blocks.get(selector);
          assert.ok(block, `tokens.css has no block for ${modifier.name}=${context} (${selector})`);
          const tokens = at({ [modifier.name]: context });
          for (const id of own) {
            assert.ok(block.has(cssVar(id)), `${selector} lacks ${cssVar(id)}, which ${modifier.name} changes`);
            expectReference(block, tokens, id, selector);
          }
          // a declaration of another modifier's token would reset it inside this subtree
          for (const name of block.keys()) {
            const id = [...others].find((other) => cssVar(other) === name);
            assert.ok(!id, `${selector} declares ${name}, which another modifier changes`);
          }
        });
      }
    }
  }

  test("tokens.js references every token, and tokens.d.ts types the same exports", () => {
    const js = read("tokens.js");
    for (const id of Object.keys(at({}))) {
      const name = cssVar(id);
      assert.ok(js.includes(`"var(${name})"`) || js.includes(`"var(${name}-`), `tokens.js lacks ${name}`);
    }
    const exports = (source: string) => [...source.matchAll(/^export const (\w+)/gm)].map((m) => m[1]).sort();
    assert.deepEqual(exports(read("tokens.d.ts")), exports(js));
  });

  test("tokens.scss maps every token", () => {
    const scss = read("tokens.scss");
    for (const id of Object.keys(at({}))) assert.ok(scss.includes(`"${id}": `), `tokens.scss lacks "${id}"`);
  });
});
