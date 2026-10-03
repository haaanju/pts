// Checks the changesets of a pull request (ADR 0035), run by CI.
// - A change to a package needs a changeset (`changeset status` fails otherwise); a change that
//   needs no release (docs, tooling, CI) gets an empty one: `npx changeset --empty`.
// - Every changeset names @pts/web, since its CHANGELOG.md is the project's changelog.
// - The summary starts with Breaking:, New:, or Fix:, and the bump matches it (ADR 0014):
//   before 1.0, Breaking is minor and New and Fix are patch; from 1.0, major, minor, patch.
//   A major bump before 1.0 is refused: 1.0.0 is released on purpose, not by a changeset.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const since = process.argv[2] ?? "origin/main";
const out = join(mkdtempSync(join(tmpdir(), "changesets-")), "status.json");
try {
  execFileSync("npx", ["changeset", "status", `--since=${since}`, `--output=${out}`], { stdio: "inherit" });
} catch {
  console.error("\nAdd a changeset (see CONTRIBUTING.md, Releases), or `npx changeset --empty` if nothing ships.");
  process.exit(1);
}

const { changesets } = JSON.parse(readFileSync(out, "utf8"));
const major = Number(JSON.parse(readFileSync("packages/web/package.json", "utf8")).version.split(".")[0]);
const bumps = major === 0
  ? { Breaking: "minor", New: "patch", Fix: "patch" }
  : { Breaking: "major", New: "minor", Fix: "patch" };

const errors = [];
for (const { id, summary, releases } of changesets) {
  if (releases.length === 0) continue; // an empty changeset: nothing to release
  const web = releases.find((r) => r.name === "@pts/web");
  if (!web) {
    errors.push(`${id}: name "@pts/web", whose CHANGELOG.md is the project's changelog`);
    continue;
  }
  const kind = /^(Breaking|New|Fix):/.exec(summary.trim())?.[1];
  if (!kind) errors.push(`${id}: start the summary with Breaking:, New:, or Fix:`);
  else if (web.type !== bumps[kind]) errors.push(`${id}: ${kind} is a ${bumps[kind]} bump in ${major}.x, not ${web.type}`);
}
if (errors.length) {
  console.error(errors.map((e) => `changeset ${e}`).join("\n"));
  process.exit(1);
}
console.log(`${changesets.length} changeset(s) OK`);
