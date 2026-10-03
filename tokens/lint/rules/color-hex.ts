// pts/color-hex: a color's hex describes the same color as its components.
// Why not built-in: core/valid-color validates hex and components separately, not against each other.
// The CSS output uses hex; other formats use components, so a mismatch ships two different colors.
import type { LintRule } from "@terrazzo/parser";
import { files, loadResolver } from "../../source.ts";

type ColorObject = { components?: number[]; hex?: string };

const toHex = (components: number[]) => "#" + components.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 10000) / 10000);

const rule: LintRule<"MISMATCH"> = {
  meta: {
    docs: { description: "A color's hex matches its components." },
    messages: { MISMATCH: "{{file}}: {{id}} has hex {{hex}}, but its components are {{actual}}{{hint}}" },
  },
  defaultOptions: {},
  async create({ report }) {
    for (const { path: file, tokens } of files(await loadResolver())) {
      for (const [id, token] of Object.entries(tokens)) {
        const value = token.$value as ColorObject;
        if (token.$type !== "color" || !value || typeof value !== "object" || !value.components) continue;
        const actual = toHex(value.components);
        if (value.hex?.toLowerCase() === actual) continue;
        // most edits change the hex (copied from Figma), so say which components match it
        const hint = /^#[0-9a-f]{6}$/i.test(value.hex ?? "") ? `; the components for ${value.hex} are [${fromHex(value.hex!).join(", ")}]` : "";
        report({ messageId: "MISMATCH", data: { file, id, hex: value.hex, actual, hint } });
      }
    }
  },
};

export default rule;
