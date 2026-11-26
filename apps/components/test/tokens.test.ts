// The committed Lit token modules (src/<component>/<component>.tokens.ts, ADR 0079) against Terrazzo's resolver: :host declares every component
// token as a reference to the semantic token it aliases, and nothing else. It reads the committed files without a
// build, so a token change committed without `npm run build -w @pts/components` fails here.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { suite, test } from "node:test";
import { makeCSSVar, transformCSSValue } from "@terrazzo/token-tools/css";
import { files, loadResolver, tierIds } from "../../../tokens/source.ts";

const resolver = await loadResolver();
const tokens = resolver.apply({});
const semantic = new Set(tierIds(resolver, "semantic"));

// What plugin-css writes for a token: a reference to the token it aliases, a composite as one per property. It adds a
// typography token's font shorthand itself, from those properties, so the shorthand isn't here.
const declarations = (id: string): [string, string][] => {
  const value = transformCSSValue(tokens[id], { tokensSet: tokens, permutation: {} });
  const parts = typeof value === "string" ? { ".": value } : (value as Record<string, string>);
  return Object.entries(parts).map(([part, v]) => [part === "." ? makeCSSVar(id) : `${makeCSSVar(id)}-${part}`, v]);
};
const shorthand = (id: string) => (tokens[id].$type === "typography" ? [makeCSSVar(id)] : []);

for (const file of files(resolver).filter((f) => f.tier === "component")) {
  suite(`src/${file.name}/${file.name}.tokens.ts`, () => {
    const source = readFileSync(new URL(`../src/${file.name}/${file.name}.tokens.ts`, import.meta.url), "utf8");
    const host = source.match(/^:host \{\n([\s\S]*?)^\}/m)?.[1] ?? "";
    const declared = new Map([...host.matchAll(/^\s*(--[\w-]+):\s*(.*);$/gm)].map((m) => [m[1], m[2]]));
    const ids = Object.keys(file.tokens);

    for (const id of ids) {
      test(`${makeCSSVar(id)} references the semantic token it aliases`, () => {
        const target = tokens[id].aliasChain?.[0];
        assert.ok(target && semantic.has(target), `${id} aliases ${target}, not a semantic token`);
        for (const [property, value] of declarations(id)) assert.equal(declared.get(property), value, property);
        for (const name of shorthand(id)) {
          const refs = [...(declared.get(name) ?? "").matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]);
          assert.ok(refs.length && refs.every((ref) => ref.startsWith(`${name}-`)), `${name} is a shorthand of its own properties`);
        }
      });
    }

    test("declares nothing but its tokens", () => {
      const expected = new Set(ids.flatMap((id) => [...declarations(id).map(([property]) => property), ...shorthand(id)]));
      assert.deepEqual([...declared.keys()].sort(), [...expected].sort());
    });
  });
}
