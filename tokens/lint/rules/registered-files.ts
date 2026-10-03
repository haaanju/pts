// pts/registered-files: every .tokens.json under src/ is listed in pts.resolver.json.
// Why not built-in: Terrazzo only reads the files the resolver lists, so an unlisted file is never seen:
// its tokens silently miss the build and the docs.
import type { LintRule } from "@terrazzo/parser";
import { onDisk, registered } from "../../source.ts";

const rule: LintRule<"UNREGISTERED"> = {
  meta: {
    docs: { description: "Every token file is listed in pts.resolver.json." },
    messages: { UNREGISTERED: "{{file}} is not in pts.resolver.json, so nothing reads it" },
  },
  defaultOptions: {},
  create({ report }) {
    const listed = new Set(registered());
    for (const file of onDisk()) if (!listed.has(file)) report({ messageId: "UNREGISTERED", data: { file } });
  },
};

export default rule;
