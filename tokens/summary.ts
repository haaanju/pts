// The build summary (ADR 0074): what a platform's `tz build` wrote, and where. Terrazzo's own line ("329 tokens built")
// counts the tokens it read, the same for every platform, so each platform's config adds this plugin and says what its
// files hold. A file no row covers is listed under "other", so a new output can't drop out of the summary unseen.
// One entry per line: a folder label, then each entry's name and detail in aligned columns.
//   summary(dir, rows)   a plugin that prints "<package> <version> → <its dist/>", then the rows
//   print(rows)          aligned rows, for a step that writes more after the build (build-fonts.ts)
//   names(files)         file names, with a .d.ts next to its .js: "tokens.js + .d.ts"
//   counted(files, n)    source files as their class names, each with how many tokens it holds
//   count(n)             a number in an entry, highlighted
//   heading(dir)         "<package> <version> → <its dist/>"
// On a terminal the package name is bold, the folders dim, and the counts cyan; styleText leaves the colors out when
// stdout isn't a terminal (CI logs, a pipe) or NO_COLOR is set, so the text and its alignment are the same either way.
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { styleText } from "node:util";
import type { Plugin } from "@terrazzo/parser";

/** One line: a name alone, or a name and its detail in the next column */
export type Entry = string | [name: string, detail: string];
/** A folder ("kotlin/", or "" for the files at the top) and its entries */
export type Row = [label: string, entries: Entry[]];

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const LABEL = 12;

/** A number in an entry, cyan on a terminal and padded to width, so a column of counts lines up: "60 color sets", " 3" */
export const count = (n: number, width = 0) => styleText("cyan", String(n).padStart(width));

/**
 * "  kotlin/     PtsBorder      15", one line per entry. Names are padded to the longest in these rows, and a label is
 * padded before it is dimmed, so color codes don't shift the columns.
 */
export const print = (rows: Row[]) => {
  const width = Math.max(0, ...rows.flatMap(([, entries]) => entries.map((e) => (typeof e === "string" ? 0 : e[0].length)))) + 2;
  const line = (label: string, e: Entry) =>
    `  ${styleText("dim", label.padEnd(LABEL))}${typeof e === "string" ? e : `${e[0].padEnd(width)}${e[1]}`}`.trimEnd();
  return rows.flatMap(([label, entries]) => entries.map((e, i) => line(i === 0 ? label : "", e))).join("\n");
};

/** Base names in order, a .d.ts folded into its .js: ["tokens.css", "tokens.d.ts", "tokens.js"] → ["tokens.css", "tokens.js + .d.ts"] */
export const names = (files: string[]): string[] => {
  const base = files.map((f) => f.slice(f.lastIndexOf("/") + 1));
  return base
    .filter((f) => !(f.endsWith(".d.ts") && base.includes(f.replace(/\.d\.ts$/, ".js"))))
    .map((f) => (f.endsWith(".js") && base.includes(f.replace(/\.js$/, ".d.ts")) ? `${f} + .d.ts` : f));
};

/** Class names from file names, each with its token count where counts has one, right-aligned: [["PtsColors", "60"], ["PtsFonts", " 3"], "PtsShape"] */
export const counted = (files: string[], counts: Record<string, number>): Entry[] => {
  const width = Math.max(0, ...Object.values(counts).map((n) => String(n).length));
  return files
    .map((f) => f.slice(f.lastIndexOf("/") + 1).replace(/\.\w+$/, ""))
    .map((name) => (name in counts ? [name, count(counts[name], width)] : name));
};

/** "@pts/android 0.11.0 → packages/android/dist", for the package in dir; the package name bold on a terminal */
export const heading = (dir: URL) => {
  const { name, version } = JSON.parse(readFileSync(new URL("package.json", dir), "utf8"));
  return `${styleText("bold", name)} ${version} → ${relative(ROOT, fileURLToPath(new URL("dist", dir)))}`;
};

/** A file size for a column of sizes: "71.4 KB", padded to line up */
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`.padStart(8);

/**
 * Prints the heading when the config loads, so an error in this platform's build shows under its name, and the rows
 * once the build ends. rows gets every file written (relative to dist/, sorted) and a size(file) for showing one, and
 * returns the rows: a label is the folder its row covers ("kotlin/"), or "" for the files at the top.
 */
export default function summary(dir: URL, rows: (files: string[], size: (file: string) => string) => Row[]): Plugin {
  let started = false; // Terrazzo may load the config more than once
  return {
    name: "pts-summary",
    config() {
      if (!started) console.log(`\n${heading(dir)}`);
      started = true;
    },
    buildEnd({ outputFiles }) {
      const files = outputFiles.map((f) => f.filename).sort();
      const bytes = new Map(outputFiles.map((f) => [f.filename, Buffer.byteLength(f.contents)]));
      const parts = rows(files, (file) => kb(bytes.get(file) ?? 0));
      const covered = (file: string) => parts.some(([label]) => (label ? file.startsWith(label) : !file.includes("/")));
      const other = files.filter((f) => !covered(f));
      if (other.length) parts.push(["other", other]);
      console.log(print(parts));
    },
  };
}
