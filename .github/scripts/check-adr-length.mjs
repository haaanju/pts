// Holds every ADR from 0079 on to 800 words, run by the pre-commit hook and CI (CLAUDE.md, Decisions).
// Earlier ADRs are left out: an accepted ADR's body doesn't change.
import { readdirSync, readFileSync } from "node:fs";

const FIRST_ADR = 79;
const MAX_WORDS = 800;
const dir = new URL("../../docs/adr/", import.meta.url);

const tooLong = readdirSync(dir)
  .filter((name) => parseInt(name, 10) >= FIRST_ADR)
  .map((name) => ({ name, words: readFileSync(new URL(name, dir), "utf8").split(/\s+/).filter(Boolean).length }))
  .filter(({ words }) => words > MAX_WORDS);

for (const { name, words } of tooLong) {
  console.error(`docs/adr/${name}: ${words} words, at most ${MAX_WORDS}. Cut it, or split the decision into two ADRs.`);
}
if (tooLong.length > 0) process.exit(1);
