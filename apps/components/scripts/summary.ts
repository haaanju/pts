// Prints what `npm run build` wrote, in the shape of the token builds' summaries (tokens/summary.ts, ADR 0074): the
// package and its dist/, each file with the element it defines (button.js defines <pts-button>), and a count.
import { readdirSync } from "node:fs";
import { styleText } from "node:util";
import { heading, names, print } from "../../../tokens/summary.ts";

const dir = new URL("../", import.meta.url);
// dist/tokens/ holds the token modules the components import, not elements
const files = names(readdirSync(new URL("dist/", dir), { withFileTypes: true }).filter((f) => f.isFile()).map((f) => f.name).sort());
const elements = files.map((name): [string, string] => [name, `<pts-${name.split(".")[0]}>`]);
console.log(`\n${heading(dir)}\n${print([["", elements]])}`);
console.log(`${styleText("green", "✔")}  ${elements.length} component${elements.length === 1 ? "" : "s"} built`);
