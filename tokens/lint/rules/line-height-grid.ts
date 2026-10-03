// pts/line-height-grid: every font-size step has a line-height of the same name, size × line-height lands on the
// grid, in every permutation, and every text style takes the line-height paired with its size (ADR 0028).
// Why not built-in: DTCG line heights are unitless ratios, so the px line they produce only exists once a ratio is
// multiplied by its font size; no built-in rule pairs two tokens like that. Terrazzo also lints the default
// permutation only, and the viewport changes both (ADR 0029).
import type { LintRule } from "@terrazzo/parser";
import { loadResolver, permutations } from "../../source.ts";

type Options = { gridPx: number };
type Dimension = { value: number; unit: string };

const rule: LintRule<"MISSING" | "UNPAIRED" | "OFF_GRID" | "STYLE_MISMATCH", Options> = {
  meta: {
    docs: { description: "Line heights pair with font-size steps and produce whole grid steps." },
    messages: {
      MISSING: "{{label}}: {{size}} has no line-height.{{step}}",
      UNPAIRED: "{{label}}: {{id}} has no font-size.{{step}} to pair with",
      OFF_GRID: "{{label}}: {{id}} gives a {{line}}px line on {{size}}px text, not a multiple of {{grid}}px",
      STYLE_MISMATCH: "{{id}} uses {{lineHeight}} with {{fontSize}}; a text style takes the line-height paired with its size",
    },
  },
  defaultOptions: { gridPx: 4 },
  async create({ options, report }) {
    // the same problem shows up in every permutation that shares the values: report it once
    const seen = new Set<string>();
    const once = (key: string, send: () => void) => {
      if (!seen.has(key)) {
        seen.add(key);
        send();
      }
    };
    for (const { label, tokens } of permutations(await loadResolver())) {
      if (!tokens) continue; // reported by pts/theme-parity
      const steps = (group: string) => new Set(Object.keys(tokens).filter((id) => id.startsWith(`${group}.`)).map((id) => id.slice(group.length + 1)));
      const sizes = steps("font-size");
      const lines = steps("line-height");
      for (const step of sizes) if (!lines.has(step)) once(`missing ${step}`, () => report({ messageId: "MISSING", data: { label, size: `font-size.${step}`, step } }));
      for (const step of lines) {
        const id = `line-height.${step}`;
        if (!sizes.has(step)) {
          once(`unpaired ${step}`, () => report({ messageId: "UNPAIRED", data: { label, id, step } }));
          continue;
        }
        const size = (tokens[`font-size.${step}`].$value as Dimension).value;
        const line = size * (tokens[id].$value as number);
        // ratios like 20/14 aren't exact in binary, so allow rounding noise
        const off = Math.abs(line / options.gridPx - Math.round(line / options.gridPx));
        if (off > 1e-6) once(`${id} ${line} ${size}`, () => report({ messageId: "OFF_GRID", data: { label, id, line: +line.toFixed(3), size, grid: options.gridPx } }));
      }
      // Composites: Terrazzo keeps the token each property aliases (partialAliasOf)
      for (const [id, token] of Object.entries(tokens)) {
        if (token.$type !== "typography") continue;
        const { fontSize, lineHeight } = (token.partialAliasOf ?? {}) as Record<string, string | undefined>;
        if (fontSize?.replace(/^font-size\./, "line-height.") === lineHeight) continue;
        const ref = (alias?: string) => (alias ? `{${alias}}` : "a raw value");
        once(`style ${id}`, () => report({ messageId: "STYLE_MISMATCH", data: { id, fontSize: ref(fontSize), lineHeight: ref(lineHeight) } }));
      }
    }
  },
};

export default rule;
