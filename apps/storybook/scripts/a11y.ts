// Checks every docs page and story of the built Storybook with axe-core, in the light and dark themes
// (ADR 0036). Storybook's own a11y tooling (addon-a11y, addon-vitest, test-runner) checks stories only,
// and the token docs are MDX pages, so this script serves dist/ and runs axe on each entry in index.json.
// Run `npm run build-storybook` first; the root `npm run test-a11y` does both.
import { AxeBuilder } from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const dist = join(import.meta.dirname, "..", "dist");
const themes = ["light", "dark"] as const;
// WCAG 2.2 A and AA. axe's best-practice rules are left out: they are advice, not criteria.
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

const types: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  try {
    const body = await readFile(join(dist, path.endsWith("/") ? `${path}index.html` : path));
    res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

type Entry = { id: string; type: string; title: string; name: string };
const index = JSON.parse(await readFile(join(dist, "index.json"), "utf8")) as { entries: Record<string, Entry> };
const entries = Object.values(index.entries).filter((e) => e.type === "docs" || e.type === "story");
const root = (e: Entry) => (e.type === "docs" ? "#storybook-docs" : "#storybook-root");

const name = (e: Entry) => (e.type === "docs" ? e.title : `${e.title}: ${e.name}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
let failures = 0;
try {
  for (const entry of entries) {
    for (const theme of themes) {
      const tab = await context.newPage();
      await tab.goto(`${origin}/iframe.html?viewMode=${entry.type}&id=${entry.id}&globals=theme:${theme}`);
      await tab.locator(`${root(entry)} > *`).first().waitFor();
      await tab.waitForLoadState("networkidle");
      await tab.evaluate(() => document.fonts.ready);
      // [data-a11y-exempt] marks samples of colors exempt from contrast (tokens/lint/pairs.ts), such as disabled/*.
      const { violations } = await new AxeBuilder({ page: tab })
        .include(root(entry))
        .exclude("[data-a11y-exempt]")
        .withTags(tags)
        .analyze();
      for (const v of violations) {
        failures += v.nodes.length;
        console.error(`✗ ${name(entry)} (${theme}): ${v.id}, ${v.help} (${v.nodes.length})`);
        for (const node of v.nodes.slice(0, 5)) console.error(`    ${node.target.join(" ")}: ${node.failureSummary?.split("\n")[1]?.trim() ?? ""}`);
      }
      if (violations.length === 0) console.log(`✔ ${name(entry)} (${theme})`);
      await tab.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

if (failures > 0) {
  console.error(`\n${failures} accessibility violation(s)`);
  process.exit(1);
}
console.log(`\n${entries.length} docs pages and stories × ${themes.length} themes: no violations`);
