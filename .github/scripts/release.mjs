// Tags the current version and creates its GitHub Release (ADR 0035), run by the Release workflow
// on main when no changesets are pending, that is, after a release PR is merged. It does nothing
// for a version that is already tagged and released, so it is safe to run on every push.
// The tag is `vX.Y.Z` (ADR 0014); its message and the release notes are that version's section
// of packages/web/CHANGELOG.md.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const run = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8" }).trim();
const succeeds = (cmd, args) => {
  try {
    execFileSync(cmd, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const { version } = JSON.parse(readFileSync("packages/web/package.json", "utf8"));
const tag = `v${version}`;
const changelog = readFileSync("packages/web/CHANGELOG.md", "utf8");
const section = changelog.split(/^## /m).find((s) => s.startsWith(`${version}\n`));
if (!section) throw new Error(`packages/web/CHANGELOG.md has no section for ${version}`);
const notes = section.slice(version.length).trim();

if (run("git", ["ls-remote", "--tags", "origin", `refs/tags/${tag}`])) {
  console.log(`${tag} is already tagged`);
} else {
  execFileSync("git", ["tag", "-a", tag, "-m", `${tag}\n\n${notes}`], { stdio: "inherit" });
  execFileSync("git", ["push", "origin", tag], { stdio: "inherit" });
  console.log(`Tagged ${tag}`);
}

if (succeeds("gh", ["release", "view", tag])) {
  console.log(`${tag} is already released`);
} else {
  execFileSync("gh", ["release", "create", tag, "--verify-tag", "--title", tag, "--notes", notes], { stdio: "inherit" });
  console.log(`Released ${tag}`);
}
