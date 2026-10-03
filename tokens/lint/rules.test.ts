// Regression tests for the lint rules: each case breaks one rule on purpose in a copy of tokens/ and expects
// `tz check` to report it. A rule that silently stops reporting (a Terrazzo upgrade that changes the token shapes,
// a rule that skips every permutation) still passes `npm run check`; here it fails. Run with `npm test`.
// The copy is a temporary directory holding src/, lint/, source.ts, and terrazzo.config.ts, with node_modules linked to
// the repository's, so source.ts reads the copy (its paths are relative to its own file) and nothing here is mocked.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { suite, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify, stripVTControlCharacters } from "node:util";

const TOKENS = fileURLToPath(new URL("..", import.meta.url));
const NODE_MODULES = fileURLToPath(new URL("../../node_modules", import.meta.url));
const TZ = join(NODE_MODULES, ".bin", "tz");

type Json = Record<string, any>;

/** A writable copy of the token source: edit token files by id, then run `tz check` on it */
class Copy {
  readonly dir = mkdtempSync(join(tmpdir(), "pts-lint-"));

  constructor() {
    for (const path of ["src", "lint", "source.ts", "terrazzo.config.ts"]) cpSync(join(TOKENS, path), join(this.dir, path), { recursive: true });
    symlinkSync(NODE_MODULES, join(this.dir, "node_modules"), "dir");
  }

  read(file: string): Json {
    return JSON.parse(readFileSync(join(this.dir, "src", file), "utf8"));
  }

  write(file: string, json: Json) {
    const path = join(this.dir, "src", file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(json, null, 2));
  }

  /** Changes the token at a dot id (e.g. "content.base") in a file; the token is created if it doesn't exist */
  set(file: string, id: string, change: (token: Json) => Json | void) {
    const json = this.read(file);
    const keys = id.split(".");
    const parent = keys.slice(0, -1).reduce((node, key) => (node[key] ??= {}), json);
    const last = keys.at(-1)!;
    parent[last] = change(parent[last] ?? {}) ?? parent[last];
    this.write(file, json);
  }

  /** Points a token at another value, keeping its $type and $description */
  value(file: string, id: string, $value: unknown) {
    this.set(file, id, (token) => ({ ...token, $value }));
  }

  remove(file: string, id: string) {
    const json = this.read(file);
    const keys = id.split(".");
    delete keys.slice(0, -1).reduce((node, key) => node[key], json)[keys.at(-1)!];
    this.write(file, json);
  }

  /** Lists a file in a resolver set or modifier context, e.g. register("misc/x.tokens.json", "sets.base.sources") */
  register(file: string, list = "sets.base.sources") {
    const resolver = this.read("pts.resolver.json");
    list
      .split(".")
      .reduce((node, key) => node[key], resolver)
      .push({ $ref: file });
    this.write("pts.resolver.json", resolver);
  }

  async check(): Promise<{ ok: boolean; output: string }> {
    try {
      const { stdout, stderr } = await promisify(execFile)(TZ, ["check"], {
        cwd: this.dir,
        env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
      });
      return { ok: true, output: stripVTControlCharacters(stdout + stderr) };
    } catch (e) {
      const { stdout = "", stderr = "" } = e as { stdout?: string; stderr?: string };
      return { ok: false, output: stripVTControlCharacters(stdout + stderr) };
    }
  }

  dispose() {
    rmSync(this.dir, { recursive: true, force: true });
  }
}

const LIGHT = "semantic/color.light.tokens.json";
const DARK = "semantic/color.dark.tokens.json";
const TYPOGRAPHY = "semantic/typography.tokens.json";
const BUTTON = "component/button.tokens.json";
const white = { colorSpace: "srgb", components: [1, 1, 1], hex: "#ffffff" };

type Case = {
  /** what the mutation breaks */
  name: string;
  mutate: (copy: Copy) => void;
  /** the rule and a part of its message that must be reported (other rules may report too) */
  expect: [rule: string, message: string][];
};

// One case per message of every pts rule. MISSING in pts/contrast is left out: the pairs come from the ids of the
// same permutation, so a pair's tokens always exist there.
const cases: Case[] = [
  // pts/theme-parity
  { name: "a token missing from one theme", mutate: (c) => c.remove(DARK, "content.subtle"), expect: [["pts/theme-parity", "content.subtle is in"]] },
  {
    name: "a description that differs between themes",
    mutate: (c) => c.set(DARK, "content.base", (t) => ({ ...t, $description: "Something else." })),
    expect: [["pts/theme-parity", "content.base has a different $description"]],
  },
  {
    name: "a theme that does not resolve",
    mutate: (c) => c.value(DARK, "content.base", "{color.missing}"),
    expect: [["pts/theme-parity", "does not resolve"]],
  },
  {
    name: "an always color that changes in one theme",
    mutate: (c) => c.set(DARK, "always.white", () => ({ ...c.read("semantic/color.tokens.json").always.white, $value: "{color.neutral.50}" })),
    expect: [["pts/theme-parity", "always.white differs between"]],
  },

  // pts/contrast
  {
    name: "text without enough contrast",
    mutate: (c) => c.value(DARK, "content.base", "{color.neutral.900}"),
    expect: [["pts/contrast", "content.base on background"]],
  },
  {
    name: "a content name with no background",
    mutate: (c) => {
      for (const file of [LIGHT, DARK])
        c.set(file, "content.muted", () => ({ $type: "color", $value: "{color.neutral.500}", $description: "Muted text." }));
    },
    expect: [["pts/contrast", "content.muted is not a level"]],
  },
  {
    name: "a translucent color in a pair",
    mutate: (c) => c.value(DARK, "border.base", "{color.black-alpha.50}"),
    expect: [["pts/contrast", "border.base is translucent"]],
  },
  {
    name: "a semantic color outside the color grammar",
    mutate: (c) => {
      for (const file of [LIGHT, DARK])
        c.set(file, "status.error.content.base", () => ({ $type: "color", $value: "{color.red.300}", $description: "Error text." }));
    },
    expect: [["pts/contrast", "status.error.content.base is in no contrast pair and not exempt"]],
  },

  // pts/component-pairs
  {
    name: "component content and surface that pts/contrast doesn't pair",
    mutate: (c) => c.value(BUTTON, "button.primary.content", "{content.base}"),
    expect: [["pts/component-pairs", "button.primary.content → {content.base} is not checked against button.primary.surface.rest"]],
  },
  {
    name: "component content that is not an alias",
    mutate: (c) => c.value(BUTTON, "button.primary.content", white),
    expect: [
      ["pts/component-pairs", "button.primary.content is not a single alias"],
      ["pts/tier-aliases", "button.primary.content holds a raw value"],
    ],
  },

  // pts/visible-steps
  {
    name: "two surface steps with the same color",
    mutate: (c) => c.value(DARK, "surface.strong", "{color.neutral.900}"),
    expect: [["pts/visible-steps", "are the same color"]],
  },

  // pts/density-order
  {
    name: "a compact padding larger than relaxed",
    mutate: (c) => c.value("semantic/spacing.compact.tokens.json", "padding.md", "{space.800}"),
    expect: [["pts/density-order", "padding.md is 32px in compact"]],
  },
  {
    name: "a density token that is not in px",
    mutate: (c) => c.value("semantic/spacing.compact.tokens.json", "padding.xs", { value: 0.125, unit: "rem" }),
    expect: [["pts/density-order", "padding.xs is not a px dimension"]],
  },

  // pts/gap-order
  {
    name: "a gap within a group as large as a gap between groups",
    mutate: (c) => c.value("semantic/spacing.relaxed.tokens.json", "gap.within.lg", "{space.800}"),
    expect: [["pts/gap-order", "gap.within.lg (32px) is not smaller than gap.between.sm"]],
  },

  // pts/min-font-size
  {
    name: "a font size below 12px",
    mutate: (c) => c.value(TYPOGRAPHY, "font-size.text.xs", "{dimension.10}"),
    expect: [["pts/min-font-size", "font-size.text.xs is 10px, below the 12px minimum"]],
  },

  // pts/type-scale
  {
    name: "a font-size step outside the order",
    mutate: (c) => c.set(TYPOGRAPHY, "font-size.text.xxl", () => ({ $type: "dimension", $value: "{dimension.24}", $description: "Too big." })),
    expect: [["pts/type-scale", "font-size.text.xxl: font-size steps are"]],
  },
  {
    name: "font sizes out of order",
    mutate: (c) => c.value(TYPOGRAPHY, "font-size.text.sm", "{dimension.18}"),
    expect: [["pts/type-scale", "font-size.text.sm (18px) is larger than font-size.text.md (16px)"]],
  },
  {
    name: "display steps too close",
    mutate: (c) => c.value("semantic/typography.wide.tokens.json", "font-size.display.lg", "{dimension.48}"),
    expect: [["pts/type-scale", "font-size.display.md (40px) → font-size.display.lg (48px) is ×1.20"]],
  },
  {
    name: "two steps equal in every permutation",
    mutate: (c) => c.value(TYPOGRAPHY, "font-size.text.sm", "{dimension.16}"),
    expect: [["pts/type-scale", "font-size.text.sm and font-size.text.md are 16px in every permutation"]],
  },

  // pts/line-height-grid
  {
    name: "a font size without a line height",
    mutate: (c) => c.set(TYPOGRAPHY, "font-size.text.xl", () => ({ $type: "dimension", $value: "{dimension.24}", $description: "No line height." })),
    expect: [["pts/line-height-grid", "font-size.text.xl has no line-height.text.xl"]],
  },
  {
    name: "a line height without a font size",
    mutate: (c) => c.set(TYPOGRAPHY, "line-height.text.xxl", () => ({ $type: "number", $value: 1.5, $description: "Orphan." })),
    expect: [["pts/line-height-grid", "line-height.text.xxl has no font-size.text.xxl"]],
  },
  {
    name: "a line off the 4px grid",
    mutate: (c) => c.value(TYPOGRAPHY, "line-height.text.md", 1.4),
    expect: [["pts/line-height-grid", "line-height.text.md gives a 22.4px line on 16px text"]],
  },
  {
    name: "a text style with another size's line height",
    mutate: (c) => c.set(TYPOGRAPHY, "text.body-md", (t) => ({ ...t, $value: { ...t.$value, lineHeight: "{line-height.text.lg}" } })),
    expect: [["pts/line-height-grid", "text.body-md uses {line-height.text.lg} with {font-size.text.md}"]],
  },

  // pts/color-hex
  {
    name: "a hex that doesn't match the components",
    mutate: (c) => c.set("primitive/color.tokens.json", "color.white", (t) => ({ ...t, $value: { ...t.$value, hex: "#fefefe" } })),
    expect: [["pts/color-hex", "color.white has hex #fefefe, but its components are #ffffff"]],
  },

  // pts/tier-aliases
  {
    name: "a token file outside the tier folders",
    mutate: (c) => {
      c.write("misc/extra.tokens.json", { extra: { $type: "number", $value: 1 } });
      c.register("misc/extra.tokens.json");
    },
    expect: [["pts/tier-aliases", "misc/extra.tokens.json: token files go in"]],
  },
  {
    name: "a semantic token with a raw value",
    mutate: (c) => c.value(LIGHT, "border.subtle", white),
    expect: [["pts/tier-aliases", "border.subtle holds a raw value"]],
  },
  {
    name: "a semantic token aliasing a semantic token",
    mutate: (c) => c.value(LIGHT, "border.subtle", "{content.base}"),
    expect: [["pts/tier-aliases", "border.subtle → {content.base} is a semantic token"]],
  },
  {
    name: "a semantic token aliasing a component token",
    mutate: (c) => c.value(LIGHT, "border.subtle", "{button.primary.content}"),
    expect: [["pts/tier-aliases", "border.subtle → {button.primary.content} is a component token"]],
  },
  {
    name: "a component token aliasing a primitive",
    mutate: (c) => c.value(BUTTON, "button.primary.content", "{color.white}"),
    expect: [["pts/tier-aliases", "button.primary.content → {color.white} is a primitive token"]],
  },

  // pts/registered-files
  {
    name: "a token file the resolver doesn't list",
    mutate: (c) => c.write("semantic/extra.tokens.json", { extra: { $type: "number", $value: 1, $description: "Unlisted." } }),
    expect: [["pts/registered-files", "semantic/extra.tokens.json is not in pts.resolver.json"]],
  },

  // pts/orthogonal-modifiers
  {
    name: "a token two modifiers define",
    mutate: (c) => {
      for (const file of [LIGHT, DARK])
        c.set(file, "padding.md", () => ({ $type: "dimension", $value: "{space.300}", $description: "Padding by theme." }));
    },
    expect: [["pts/orthogonal-modifiers", "padding.md is defined by both the theme and the density modifier"]],
  },
];

suite("pts lint rules", { concurrency: availableParallelism() }, () => {
  test("the unchanged tokens pass", async () => {
    const copy = new Copy();
    try {
      const { ok, output } = await copy.check();
      assert.ok(ok, `tz check failed on an unchanged copy:\n${output}`);
    } finally {
      copy.dispose();
    }
  });

  for (const { name, mutate, expect } of cases) {
    test(`${expect.map(([rule]) => rule).join(", ")}: ${name}`, async () => {
      const copy = new Copy();
      try {
        mutate(copy);
        const { ok, output } = await copy.check();
        assert.ok(!ok, `tz check passed, but this should fail:\n${output}`);
        const lines = output.split("\n");
        for (const [rule, message] of expect) {
          assert.ok(
            lines.some((line) => line.includes(`lint:${rule}: `) && line.includes(message)),
            `expected ${rule} to report "${message}", got:\n${output}`,
          );
        }
      } finally {
        copy.dispose();
      }
    });
  }
});
