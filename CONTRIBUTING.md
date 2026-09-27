# Contributing

This guide is for anyone changing the tokens, designers first. You edit JSON files; automated checks tell you if something is wrong before it reaches `main`. See [ADR 0020](docs/adr/0020-hand-edited-tokens-and-ci-gates.md) for why it works this way.

## The flow

```
1. Explore     try the change in the Figma pts file
2. Edit        change the token JSON on a branch
3. Open a PR   fill in the template
4. Checks      CI validates the tokens and builds everything; it must pass
5. Review      the owner reviews and merges
6. Published   the docs rebuild from main automatically
```

A release (a version tag) is cut separately, when the owner decides; see [ADR 0014](docs/adr/0014-versioning-policy.md).

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

All tokens are in `tokens/src/`. There are two tiers:

| Tier | Folder | What it holds | Example |
|---|---|---|---|
| Primitive | `primitive/` | Raw values with no role | `color.red.600`, `dimension.16` |
| Semantic | `semantic/` | Values with a role, pointing at a primitive | `intent.danger.surface.base` → `{color.red.600}` |

Product code only uses semantic tokens. Most changes are to semantic tokens: pointing a role at a different primitive.

Colors and shadows differ per theme, so they have one file per theme: `color.light.tokens.json` and `color.dark.tokens.json`. **Both files must define the same token names**; only the values differ.

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

The full naming and structure rules are in [`CLAUDE.md`](CLAUDE.md) (Token Rules) and the ADRs in [`docs/adr/`](docs/adr).

## Common changes

| I want to… | Do this |
|---|---|
| Use a different color for a role | In `semantic/color.light.tokens.json` or `color.dark.tokens.json`, change the alias (`{color.red.600}` → `{color.red.700}`) |
| Change a palette color | In `primitive/color.tokens.json`, change `hex` and `components`. Every semantic token that points at it changes too |
| Change any other value | Edit it in its file. Semantic tokens point at primitives, so you usually change the alias |
| Add a token to an existing group | Add it to the file. For a themed file, add it to both `light` and `dark`. It appears in the docs by itself |
| Add a new file | Create it in `primitive/` or `semantic/` and add it to `tokens/src/pts.resolver.json`: theme-independent files in `sets.base`, per-theme files under `modifiers.theme` |
| Add a new top-level group | As above, then add a section to the matching docs page in `apps/storybook/src/` (e.g. `<Section title="Opacity"><TokenTable prefix="opacity" /></Section>`) and add the prefix to the page's `groups` |
| Rename or remove a token | This is a breaking change. Say so in the pull request |

## What the checks catch

CI runs these on every pull request. A red check blocks the merge; open the failed run to read the messages.

| Check | Catches |
|---|---|
| `npm run check` | Values that aren't valid DTCG (wrong shape, unit, or type); a name that isn't kebab-case; a missing `$type`; an alias pointing at nothing, in either theme; light and dark files with different names or descriptions; text below 4.5:1 or UI below 3:1 contrast in either theme; hover or pressed states that look the same as the resting fill; a `hex` that doesn't match its `components`; a color outside srgb; a semantic token without a `$description`; a text style below 12px; a semantic token with a raw value or pointing at another semantic token; a token file missing from the resolver |
| `npm run typecheck`, `npm run build`, `npm run build-storybook` | Changes that break the CSS output or the docs |

Messages start with the rule that failed, then name the theme or file and the token:

```
✗  lint:pts/contrast: theme=dark: intent.danger.content.base on background = 3.87 (needs 4.5)
```

Here the danger text is too dark on the dark page: point it at a lighter step in `color.dark.tokens.json`.

## The pull request

The template asks for:

- **What changed**, with old → new values for value changes.
- **The type of change**: breaking, new, fix, or other. It decides the next version number.
- **Figma**: the variables and specimens match the new values. The contrast badges and hex labels on the specimen pages are drawn by hand, so update them too.

## Decisions

A change to structure, naming, or tooling, not just a value, needs an architecture decision record in `docs/adr/`. Start with status `proposed`; it becomes `accepted` once implemented. Look at the recent ADRs for the format.

All repository content is in English: token names, descriptions, docs, and commit messages.
