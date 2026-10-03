# 0036. Accessibility Check of the Docs

- Status: accepted
- Date: 2026-10-03

## What we learned

`npm run check` holds the tokens to WCAG contrast in both themes (ADR 0021), but nothing checked the pages that present them. The docs are where colleagues and consumers meet the system, and they dogfood the tokens (ADR 0011), so an inaccessible docs page is a bug in the token work.

Storybook's own tools don't reach most of the docs:

- **`@storybook/addon-a11y`** runs axe-core on a story and shows the result in a panel. It checks stories, not MDX docs pages, and only while someone looks.
- **`@storybook/addon-vitest` and the test runner** run stories in CI, with the a11y addon's checks as tests. Also stories only.

Every token page is an MDX docs page; only Button has stories. A script that serves the built Storybook and runs axe-core through Playwright on every entry of `index.json`, docs and stories, in both themes, covers them all.

The first run found 51 violations on three pages, all real:

- **HTML code blocks were unreadable in light.** `docs.css` recolored the CSS syntax with tokens, but HTML's `tag`, `attr-name`, and `attr-value` kept Storybook's dark syntax colors on the light block (1.15:1 to 3.05:1).
- **The Controls table was white on the dark page**, and its header and toggle labels failed contrast (3.09:1, 3.28:1): Storybook styles it for its static light docs theme.
- **The disabled samples** (`disabled/content`, `button/disabled/content`) are shown at their real contrast on purpose. WCAG exempts inactive components, and `pts/contrast` already skips them.

## Why it matters

- **Every docs page and story is checked with axe-core in light and dark**, against WCAG 2.2 A and AA. axe's best-practice rules are left out: they are advice, not criteria. CI runs it on every push and pull request; a violation fails the build.
- **Exemptions follow the lint.** A color exempt from contrast (`isExempt`, `tokens/lint/pairs.ts`) is shown with `data-a11y-exempt`, and the check skips that element. Nothing else is exempt: a violation is fixed, not excluded.
- **Storybook's blocks are restyled with tokens**, as the code block already was, so the Controls table and every syntax color follow the theme toggle.
- **`addon-a11y` stays for development**: the Accessibility panel on a story, with the same rules and exemption (`parameters.a11y`).

## Trade-offs

- **About 30 seconds and a Chromium download in CI.** The browser isn't cached.
- **axe finds only the issues a machine can decide.** Keyboard flow, focus order, and screen-reader wording still need a person.
- **One viewport and one density.** The docs' phone layout (360px) and compact density are not scanned; the structure is the same, and contrast doesn't change with either.

## Implementation notes

- `apps/storybook/scripts/a11y.ts`: a static server on `dist/`, Playwright Chromium, `@axe-core/playwright` on `#storybook-docs` or `#storybook-root` per entry, `?globals=theme:light|dark`. Type-checked by `scripts/tsconfig.json`; run by Node without a build.
- `npm run test-a11y` (root) builds Storybook, then runs it; `npm run test-a11y -w @pts/storybook` runs it on an existing build, as CI does.
- `components.tsx`: `data-a11y-exempt` on the content sample of an exempt color.
- `docs.css`: token colors for HTML syntax (`tag` discovery, `attr-name` info, `attr-value` success, as CSS's selectors, properties, and strings) and for the Controls table (cells, header, string chips, textarea, radios, boolean toggles).
- `.storybook/main.ts` adds `@storybook/addon-a11y`; `preview.ts` sets its rules and exclusion.
- Verified: 51 violations before the fixes, none after, in 14 entries (12 docs pages, 2 stories) × 2 themes; the restyled table and code blocks checked by screenshot in both themes.

## Documented in

- `CLAUDE.md` — Commands
- `.claude/rules/storybook.md` — Accessibility
- `README.md` — Development
