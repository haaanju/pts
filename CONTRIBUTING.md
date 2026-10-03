# Contributing

This guide is for anyone changing the tokens, designers first. You edit JSON files; automated checks tell you if something is wrong before it reaches `main`. See [ADR 0020](docs/adr/0020-hand-edited-tokens-and-ci-gates.md) for why it works this way.

## The flow

```
1. Explore     try the change in the Figma pts file
2. Edit        change the token JSON on a branch
3. Open a PR   fill in the template and add a changeset
4. Checks      CI validates the tokens and builds everything; it must pass
5. Review      the owner reviews and merges
6. Merged      the change is on main, in the docs (https://haaanju.github.io/pts/), and ships with the next release
```

A release is cut separately, when the owner decides; see [Releases](#releases).

**The JSON is the source of truth, not Figma.** Figma is where you try things. Once a change is merged, the JSON is what ships, and Figma should match it.

## Two ways to edit

- **In the browser.** Open a file on GitHub, click the pencil icon, edit, and choose "Create a new branch and start a pull request". Nothing to install; the checks run on the pull request.
- **On your machine.** Install Node 22.18 or later, then:

  ```sh
  git clone <repo> && cd pts
  npm install              # also installs a hook that runs the checks before each commit
  git switch -c feature/my-change
  # edit, then
  npm run check            # every token rule (tz check); the fastest feedback
  npm run storybook        # the docs at http://localhost:6006, with your change
  ```

## Where tokens live

All tokens are in `tokens/src/`. There are three tiers:

| Tier | Folder | What it holds | Example |
|---|---|---|---|
| Primitive | `primitive/` | Raw values with no role | `color.red.600`, `dimension.16` |
| Semantic | `semantic/` | Values with a role, pointing at a primitive | `intent.danger.surface.base` → `{color.red.600}` |
| Component | `component/` | What one component uses, pointing at a semantic token | `button.danger.surface.rest` → `{intent.danger.surface.base}` |

Product code uses semantic tokens, and a component's own code uses its component tokens. Most changes are to semantic tokens: pointing a role at a different primitive.

Colors and shadows differ per theme, so they have one file per theme: `color.light.tokens.json` and `color.dark.tokens.json`. Padding, the within and between gaps, and control heights differ per density, so they have one file per density: `spacing.relaxed.tokens.json` and `spacing.compact.tokens.json`, `size.relaxed.tokens.json` and `size.compact.tokens.json`. The display font sizes, line heights, and letter spacing differ per viewport, so they have one file per viewport: `typography.narrow.tokens.json` and `typography.wide.tokens.json`. **The files of one pair must define the same token names**; only the values differ.

## Token format

Every token has a `$type` and a `$value`. Names are kebab-case.

A semantic token points at a primitive with an alias, the full path in braces:

```json
"base": {
  "$type": "color",
  "$value": "{color.red.600}",
  "$description": "Strong danger fill for destructive buttons, badges, and tags. Use content/inverse on it."
}
```

Every semantic token needs a `$description`: when to use it (for a color, also which content goes on it). Keep it the same in the light and dark files, and the same as the Figma variable's description.

A primitive color holds the value itself. `hex` and `components` must describe the same color; `components` are the red, green, and blue channels from 0 to 1 (the hex pair ÷ 255, four decimals):

```json
"600": {
  "$type": "color",
  "$value": {
    "colorSpace": "srgb",
    "components": [0.7255, 0.1529, 0.1882],
    "hex": "#b92730"
  }
}
```

You don't need to work out `components` by hand: change the `hex`, run the checks, and the error message gives the `components` to paste in.

Dimensions are px objects: `{ "value": 16, "unit": "px" }`.

The full naming and structure rules are in [`CLAUDE.md`](CLAUDE.md) (Token Rules), the Figma conventions in [`.claude/skills/figma/`](.claude/skills/figma/SKILL.md), and the reasons in the ADRs in [`docs/adr/`](docs/adr).

## Common changes

| I want to… | Do this |
|---|---|
| Use a different color for a role | In `semantic/color.light.tokens.json` or `color.dark.tokens.json`, change the alias (`{color.red.600}` → `{color.red.700}`) |
| Change a palette color | In `primitive/color.tokens.json`, change `hex` and `components`. Every semantic token that points at it changes too |
| Change any other value | Edit it in its file. Semantic tokens point at primitives, so you usually change the alias |
| Add a token to an existing group | Add it to the file. For a themed file, add it to both `light` and `dark`; for a density file, to both `relaxed` and `compact` (compact one `space` step smaller); for a viewport file, to both `narrow` and `wide`. It appears in the docs by itself |
| Add a new file | Create it in `primitive/` or `semantic/` and add it to `tokens/src/pts.resolver.json`: mode-independent files in `sets.base`, per-theme files under `modifiers.theme`, per-density files under `modifiers.density`, per-viewport files under `modifiers.viewport` |
| Add a new top-level group | As above, then add a section to the matching docs page in `apps/storybook/src/` (e.g. `<Section title="Opacity" path="opacity/*"><TokenTable prefix="opacity" /></Section>`) and add the prefix to the page's `groups` |
| Rename or remove a token | This is a breaking change. Say so in the pull request |

## What the checks catch

CI runs these on every pull request. A red check blocks the merge; open the failed run to read the messages.

| Check | Catches |
|---|---|
| `npm run check` | Values that aren't valid DTCG (wrong shape, unit, or type); a name that isn't kebab-case; a missing `$type`; an alias pointing at nothing, in any theme, density, or viewport; light and dark (or relaxed and compact, or narrow and wide) files with different names or descriptions; a compact value larger than its relaxed one; a `within` gap not smaller than every `between` gap, or a `between` gap not smaller than every `section` gap; text below 4.5:1 or UI below 3:1 contrast in either theme; hover or pressed states that look the same as the resting fill; a `hex` that doesn't match its `components`; a color outside srgb; a semantic token without a `$description`; a text style or `font-size` step below 12px, in any viewport; font sizes out of order, display steps less than ×1.5 apart, or two steps the same size in every viewport; a font size without its line height, a line that isn't a whole 4px step, or a text style using another size's line height; a semantic token with a raw value or pointing at another semantic token; a token file missing from the resolver |
| `npm run typecheck`, `npm run build`, `npm run build-storybook` | Changes that break the CSS output or the docs |
| `npm test` | A change to a check (`tokens/lint/`) that stops it reporting what it should |

Messages start with the rule that failed, then name the theme or file and the token:

```
✗  lint:pts/contrast: theme=dark: intent.danger.content.base on background = 3.87 (needs 4.5)
```

Here the danger text is too dark on the dark page: point it at a lighter step in `color.dark.tokens.json`.

## The pull request

The template asks for:

- **What changed**, with old → new values for value changes.
- **A changeset**: see below. CI fails without one.
- **Figma**: the variables and specimens match the new values. The contrast badges and hex labels on the specimen pages are drawn by hand, so update them too.

## Releases

Each pull request says what it changes for the next release in a **changeset**, a small file in `.changeset/` ([ADR 0035](docs/adr/0035-changesets-releases.md)). Create `.changeset/<any-kebab-name>.md`:

```md
---
"@pts/web": patch
---

Fix: intent/danger/content/base is red.300 in dark (was red.400) for 4.5:1 on the page.
```

- **Always name `@pts/web`.** Every package shares one version, and `packages/web/CHANGELOG.md` is the changelog.
- **Start the summary with the type of change**, and pick the bump that goes with it ([ADR 0014](docs/adr/0014-versioning-policy.md)):

  | Summary starts with | When | Bump (before 1.0) |
  |---|---|---|
  | `Breaking:` | a token renamed or removed, a name's meaning changed, the output format or selectors changed | `minor` |
  | `New:` | new tokens, groups, themes, or outputs | `patch` |
  | `Fix:` | a value adjusted within its role, docs | `patch` |

- **Nothing to release** (tooling, CI, a docs page no one installs): run `npx changeset --empty`.
- Say what a consumer needs to know: old → new values, and for a breaking change what to use instead.

Once merged, changesets wait on `main`. A pull request titled **Release** collects them and shows the next version and changelog; the owner merges it when it's time, and the version tag and the GitHub Release follow automatically.

## Decisions

A change to structure, naming, or tooling, not just a value, needs an architecture decision record in `docs/adr/`. Start with status `proposed`; it becomes `accepted` once implemented. Look at the recent ADRs for the format.

All repository content is in English: token names, descriptions, docs, and commit messages.
