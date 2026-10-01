// pts/line-height-grid: every font-size step has a line-height of the same name, size × line-height lands on the
// grid, and every text style takes the line-height paired with its size (ADR 0028).
// Why not built-in: DTCG line heights are unitless ratios, so the px line they produce only exists once a ratio is
// multiplied by its font size; no built-in rule pairs two tokens like that.
import type { LintRule } from "@terrazzo/parser";
import { files } from "../source.ts";

type Options = { gridPx: number };
type Dimension = { value: number; unit: string };

const rule: LintRule<"MISSING" | "UNPAIRED" | "OFF_GRID" | "STYLE_MISMATCH", Options> = {
  meta: {
    docs: { description: "Line heights pair with font-size steps and produce whole grid steps." },
    messages: {
      MISSING: "{{size}} has no line-height.{{step}}",
      UNPAIRED: "{{id}} has no font-size.{{step}} to pair with",
      OFF_GRID: "{{id}} gives a {{line}}px line on {{size}}px text, not a multiple of {{grid}}px",
      STYLE_MISMATCH: "{{id}} uses {{lineHeight}} with {{fontSize}}; a text style takes the line-height paired with its size",
    },
  },
  defaultOptions: { gridPx: 4 },
  create({ tokens, options, report }) {
    const steps = (group: string) => new Set(Object.keys(tokens).filter((id) => id.startsWith(`${group}.`)).map((id) => id.slice(group.length + 1)));
    const sizes = steps("font-size");
    const lines = steps("line-height");
    for (const step of sizes) if (!lines.has(step)) report({ messageId: "MISSING", data: { size: `font-size.${step}`, step } });
    for (const step of lines) {
      const id = `line-height.${step}`;
      if (!sizes.has(step)) {
        report({ messageId: "UNPAIRED", data: { id, step } });
        continue;
      }
      const size = (tokens[`font-size.${step}`].$value as Dimension).value;
      const line = size * (tokens[id].$value as number);
      // ratios like 20/14 aren't exact in binary, so allow rounding noise
      const off = Math.abs(line / options.gridPx - Math.round(line / options.gridPx));
      if (off > 1e-6) report({ messageId: "OFF_GRID", data: { id, line: +line.toFixed(3), size, grid: options.gridPx } });
    }
    // Composites: read the files, since a resolved composite no longer says which tokens it aliased
    for (const { tokens: raw } of files()) {
      for (const [id, token] of Object.entries(raw)) {
        if (token.$type !== "typography") continue;
        const { fontSize, lineHeight } = token.$value as Record<string, string>;
        const sizeStep = fontSize?.match(/^\{font-size\.(.+)\}$/)?.[1];
        const lineStep = lineHeight?.match(/^\{line-height\.(.+)\}$/)?.[1];
        if (sizeStep !== lineStep) report({ messageId: "STYLE_MISMATCH", data: { id, fontSize, lineHeight } });
      }
    }
  },
};

export default rule;
