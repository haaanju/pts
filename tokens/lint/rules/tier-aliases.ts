// pts/tier-aliases: semantic tokens alias primitives, and component tokens alias semantic tokens
// (CLAUDE.md → Token Rules → Tiers, ADR 0032).
// Why not built-in: Terrazzo has no notion of tiers. The tier is the token's folder (primitive/, semantic/, or
// component/), which a merged token no longer knows, so this rule reads the files.
// Options name the documented exceptions, so they are visible in the config: groups that hold raw values, and role
// tokens that alias a semantic scale (padding/* and gap/* → space/*, ADR 0026; radius/control → radius/*, ADR 0048).
import type { LintRule } from "@terrazzo/parser";
import { isAlias, parseAlias } from "@terrazzo/token-tools";
import { files, loadResolver } from "../../source.ts";

type Options = {
  /** semantic groups that may hold raw values (z-index, breakpoint: stacking order and viewport widths have no meaning outside their role; line-height: a ratio only means something paired with its font size) */
  rawValues: string[];
  /**
   * role groups (or single role tokens, by dot path) and the only groups they alias, semantic ones included (text/*:
   * composites of the semantic typography properties; padding/* and gap/*: steps of the space/* scale, never a
   * dimension, ADR 0026; radius/control: a step of the radius/* scale, ADR 0048)
   */
  roleAliases: Record<string, string[]>;
};

/** Leaves of a value that are not aliases; a color or dimension object counts as one leaf */
const rawLeaves = (value: unknown): unknown[] => {
  if (typeof value === "string") return isAlias(value) ? [] : [value];
  if (Array.isArray(value)) return value.flatMap(rawLeaves);
  if (value && typeof value === "object" && !("colorSpace" in value) && !("unit" in value)) return Object.values(value).flatMap(rawLeaves);
  return [value];
};

const aliasesIn = (value: unknown): string[] => {
  if (typeof value === "string") return isAlias(value) ? [parseAlias(value)] : [];
  if (value && typeof value === "object") return Object.values(value).flatMap(aliasesIn);
  return [];
};

const TIERS = ["primitive", "semantic", "component"];

const rule: LintRule<"FOLDER" | "RAW_VALUE" | "SEMANTIC_ALIAS" | "ROLE_ALIAS" | "UPWARD_ALIAS" | "COMPONENT_RAW" | "COMPONENT_ALIAS", Options> = {
  meta: {
    docs: { description: "Token files sit in primitive/, semantic/, or component/; semantic tokens alias primitives, component tokens alias semantic tokens." },
    messages: {
      FOLDER: "{{file}}: token files go in primitive/, semantic/, or component/",
      RAW_VALUE: "{{file}}: {{id}} holds a raw value ({{value}}); semantic tokens alias a primitive",
      SEMANTIC_ALIAS: "{{file}}: {{id}} → {{ref}} is a semantic token; semantic tokens alias a primitive",
      ROLE_ALIAS: "{{file}}: {{id}} → {{ref}}; {{role}} aliases {{allowed}} only",
      UPWARD_ALIAS: "{{file}}: {{id}} → {{ref}} is a component token; tiers alias downward only",
      COMPONENT_RAW: "{{file}}: {{id}} holds a raw value ({{value}}); component tokens alias a semantic token",
      COMPONENT_ALIAS: "{{file}}: {{id}} → {{ref}} is a {{tier}} token; component tokens alias a semantic token",
    },
  },
  defaultOptions: { rawValues: [], roleAliases: {} },
  async create({ report, options }) {
    const all = files(await loadResolver());
    const tierOf = new Map(all.flatMap(({ tier, tokens }) => Object.keys(tokens).map((id) => [id, tier] as const)));
    for (const { path: file, tier, tokens } of all) {
      if (!TIERS.includes(tier)) report({ messageId: "FOLDER", data: { file } });
      if (tier === "component") {
        // no exceptions: a value a component needs that no semantic token holds is a missing semantic token
        for (const [id, token] of Object.entries(tokens)) {
          const [raw] = rawLeaves(token.$value);
          if (raw !== undefined) report({ messageId: "COMPONENT_RAW", data: { file, id, value: JSON.stringify(raw) } });
          for (const ref of aliasesIn(token.$value)) {
            const refTier = tierOf.get(ref);
            if (refTier !== "semantic") report({ messageId: "COMPONENT_ALIAS", data: { file, id, ref: `{${ref}}`, tier: refTier ?? "missing" } });
          }
        }
      }
      if (tier !== "semantic") continue;
      for (const [id, token] of Object.entries(tokens)) {
        const group = id.split(".")[0];
        if (!options.rawValues.includes(group)) {
          const [raw] = rawLeaves(token.$value);
          if (raw !== undefined) report({ messageId: "RAW_VALUE", data: { file, id, value: JSON.stringify(raw) } });
        }
        for (const ref of aliasesIn(token.$value)) {
          if (tierOf.get(ref) === "component") report({ messageId: "UPWARD_ALIAS", data: { file, id, ref: `{${ref}}` } });
        }
        // the role a token belongs to: a group (padding → padding/*) or the token itself (radius.control → radius/control)
        const role = Object.keys(options.roleAliases).find((key) => id === key || id.startsWith(`${key}.`));
        const allowed = role ? options.roleAliases[role] : undefined;
        const roleName = role && role.replaceAll(".", "/") + (role === id ? "" : "/*");
        for (const ref of aliasesIn(token.$value)) {
          if (allowed && !allowed.includes(ref.split(".")[0]))
            report({ messageId: "ROLE_ALIAS", data: { file, id, ref: `{${ref}}`, role: roleName, allowed: allowed.map((g) => `${g}/*`).join(", ") } });
          else if (!allowed && tierOf.get(ref) === "semantic") report({ messageId: "SEMANTIC_ALIAS", data: { file, id, ref: `{${ref}}` } });
        }
      }
    }
  },
};

export default rule;
