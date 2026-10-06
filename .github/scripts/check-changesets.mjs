// Checks the changesets of a pull request (ADR 0035), run by CI.
// - A change to a package needs a changeset (`changeset status` fails otherwise); a change that
//   needs no release (docs, tooling, CI) gets an empty one: `npx changeset --empty`.
// - Every changeset names @pts/web, since its CHANGELOG.md is the project's changelog.
// - The summary starts with Breaking:, New:, or Fix:, and the bump matches it (ADR 0014):
//   before 1.0, Breaking is minor and New and Fix are patch; from 1.0, major, minor, patch.
//   A major bump before 1.0 is refused: 1.0.0 is released on purpose, not by a changeset.
// - The tokens decide what kind of change it is, where they can (ADR 0040): both sides are resolved by Terrazzo
//   (tokens/source.ts at the base and here). A token removed or renamed needs a Breaking changeset; a token added, or
//   one whose type or value changed in any mode, needs a changeset that releases (not an empty one). A change in
//   meaning, or in the output format, still needs a person to say Breaking.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

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
// Every mode of the tokens at a tokens/source.ts: id → { $type, $value } per permutation
const resolveAt = async (source) => {
  const { loadResolver, permutations } = await import(pathToFileURL(source).href);
  return new Map(permutations(await loadResolver()).map(({ label, tokens = {} }) => [label, tokens]));
};
// The base's token source, extracted next to a link to node_modules so it resolves with the same Terrazzo
const baseSource = () => {
  const dir = mkdtempSync(join(tmpdir(), "pts-base-"));
  try {
    execFileSync("git", ["archive", `--output=${join(dir, "base.tar")}`, since, "tokens/src", "tokens/source.ts"], { stdio: "ignore" });
  } catch {
    return undefined; // the base predates tokens/source.ts
  }
  execFileSync("tar", ["-xf", join(dir, "base.tar"), "-C", dir]);
  symlinkSync(resolve("node_modules"), join(dir, "node_modules"), "dir");
  return join(dir, "tokens", "source.ts");
};

const base = baseSource();
if (base && existsSync(base)) {
  const [before, after] = await Promise.all([resolveAt(base), resolveAt(resolve("tokens/source.ts"))]);
  const ids = (modes) => new Set([...modes.values()].flatMap((tokens) => Object.keys(tokens)));
  const [was, is] = [ids(before), ids(after)];
  const removed = [...was].filter((id) => !is.has(id));
  const added = [...is].filter((id) => !was.has(id));
  const changed = [...is].filter(
    (id) => was.has(id) && [...after].some(([label, tokens]) => JSON.stringify([tokens[id]?.$type, tokens[id]?.$value]) !== JSON.stringify([before.get(label)?.[id]?.$type, before.get(label)?.[id]?.$value])),
  );
  const list = (xs) => xs.slice(0, 8).join(", ") + (xs.length > 8 ? `, and ${xs.length - 8} more` : "");
  const releasing = changesets.filter((c) => c.releases.some((r) => r.name === "@pts/web"));
  if (removed.length && !releasing.some((c) => c.summary.trim().startsWith("Breaking:")))
    errors.push(`tokens removed or renamed since ${since}: ${list(removed)}; that is Breaking (a ${bumps.Breaking} bump, a summary starting "Breaking:")`);
  else if ((added.length || changed.length) && !releasing.length)
    errors.push(`tokens added or changed since ${since}: ${list([...added, ...changed])}; add a changeset that releases them (New: or Fix:), not an empty one`);
}

if (errors.length) {
  console.error(errors.map((e) => `changeset ${e}`).join("\n"));
  process.exit(1);
}
console.log(`${changesets.length} changeset(s) OK`);
