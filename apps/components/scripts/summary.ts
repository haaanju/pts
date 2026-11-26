// Prints what `npm run build` wrote, in the shape of the token builds' summaries (tokens/summary.ts, ADR 0074): the
// package and its dist/, a folder per component with its files, the element file with the element it defines
// (button/button.js defines <pts-button>), and a count.
import { readdirSync } from "node:fs";
import { styleText } from "node:util";
import { heading, names, print, type Row } from "../../../tokens/summary.ts";

const dir = new URL("../", import.meta.url);
const components = readdirSync(new URL("dist/", dir), { withFileTypes: true }).filter((f) => f.isDirectory()).map((f) => f.name).sort();
const rows = components.map((name): Row => [
  `${name}/`,
  names(readdirSync(new URL(`dist/${name}/`, dir)).sort()).map((f) => (f.startsWith(`${name}.js`) ? [f, `<pts-${name}>`] : f)),
]);
console.log(`\n${heading(dir)}\n${print(rows)}`);
console.log(`${styleText("green", "✔")}  ${components.length} component${components.length === 1 ? "" : "s"} built`);
