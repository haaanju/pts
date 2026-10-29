// Copies dist/res/font/*.ttf from fonts/ (fonts.ts), for the library's font resources (ADR 0059, 0076), unchanged.
// Run by `npm run build` after tz build. The licenses travel with the files (OFL), into dist/res/../licenses.
import { copyFileSync, mkdirSync } from "node:fs";
import { count, print } from "../../tokens/summary.ts";
import { families } from "./fonts.ts";

const fonts = new URL("./fonts/", import.meta.url);
const out = new URL("./dist/res/font/", import.meta.url);
const licenses = new URL("./dist/licenses/", import.meta.url);
mkdirSync(out, { recursive: true });
mkdirSync(licenses, { recursive: true });

const done = new Set<string>();
for (const family of families) {
  for (const file of family.files) {
    if (done.has(file.res)) continue;
    done.add(file.res);
    copyFileSync(new URL(file.src, fonts), new URL(`${file.res}.ttf`, out));
  }
  const dir = family.files[0].src.split("/")[0];
  copyFileSync(new URL(`${dir}/LICENSE.txt`, fonts), new URL(`${dir}-LICENSE.txt`, licenses));
}
// The rest of the build summary (ADR 0074), after Terrazzo's line
console.log(print([["res/font/", [`${count(done.size)} TrueType`]]]));
