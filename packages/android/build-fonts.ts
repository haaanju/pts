// Writes dist/res/font/*.ttf from @pts/web's WOFF2 files (fonts.ts), for the library's font resources (ADR 0059).
// Run by `npm run build` after tz build. The licenses travel with the files (OFL), into dist/res/../licenses.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { decompress } from "wawoff2";
import { families } from "./fonts.ts";

const web = new URL("../web/fonts/", import.meta.url);
const out = new URL("./dist/res/font/", import.meta.url);
const licenses = new URL("./dist/licenses/", import.meta.url);
mkdirSync(out, { recursive: true });
mkdirSync(licenses, { recursive: true });

const done = new Set<string>();
for (const family of families) {
  for (const file of family.files) {
    if (done.has(file.res)) continue;
    done.add(file.res);
    const ttf = await decompress(readFileSync(new URL(file.src, web)));
    writeFileSync(new URL(`${file.res}.ttf`, out), ttf);
  }
  const dir = family.files[0].src.split("/")[0];
  copyFileSync(new URL(`${dir}/LICENSE.txt`, web), new URL(`${dir}-LICENSE.txt`, licenses));
}
console.log(`fonts: ${done.size} TrueType files in dist/res/font`);
