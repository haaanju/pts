# 0034. Components as Token Fixtures

- Status: accepted
- Date: 2026-10-03

## What we learned

ADR 0032 added `<pts-button>` in a new package, `@pts/components`, under `packages/`, the folder for what ships (ADR 0016). It treated the package as the start of a component library: `progress.md` listed Input or Select next, and the README presented it as a package to import.

That is not what the project is for. Plain is a design token monorepo: the goal is the token pipeline and the tooling around it (linting, accessibility checks, docs, automation), worked out here and then shared with colleagues as a reference. Components exist to test the component tier, not to be used by products:

- **Button already tests most of the tier**: variant and state colors, sizes that change with density, the theme and density blocks a component token needs in CSS (ADR 0025), `pts/component-pairs`, and the Figma `Component` collection.
- **A growing component library would pull the work away from tokens.** Each new component brings problems that belong to components, not tokens: form validation, ARIA references across shadow roots, server-side rendering, styling hooks.
- **`packages/` and one shared version imply a published library.** `@pts/components` is private and has no consumer except Storybook, but a reader of the README or the folder layout would assume otherwise, and a component API change has no place in the token-centric versioning rules (ADR 0014).

The web-component choice of ADR 0032 still fits a fixture: it works without a framework, as the tokens do, and its shadow root checks that `data-theme` and `data-density` reach encapsulated styles.

## Why it matters

- **The repository is a design token monorepo.** Tokens, their outputs, and the tooling are the product; components are not.
- **Components are fixtures for the component tier.** `@pts/components` moves to `apps/components`: internal, not published, and not part of the public package list. `apps/` now holds things that run or test the tokens, not only docs.
- **A new component is added only when the tier needs a test it doesn't have**, such as a component-specific state (selected, checked, ADR 0018) or a token-typed property (ADR 0030). Not to grow a library. None is planned now.
- **Fixture code keeps the same quality bar.** Colleagues will read it as a reference implementation, so the accessibility and spec rules in `.claude/rules/components.md` stay as they are.
- **Not breaking.** The package was never published, and its name, exports, and the built CSS are unchanged; no release is needed.

## Implementation notes

- `git mv packages/components apps/components`; the package name stays `@pts/components`, so imports and Storybook's dependency don't change. `package-lock.json` follows the new path.
- `apps/storybook/tsconfig.json`: the `paths` mapping points at `../components/src/*`.
- `.claude/rules/components.md` loads with `apps/components/**`.
- ADR 0016 and ADR 0032 are marked `amended by 0034`.

## Documented in

- `CLAUDE.md` — the project description, Where things are written, Structure, Commands
- `README.md` — the introduction, Packages, Components
- `.claude/rules/components.md` — paths and purpose
- `docs/progress.md` — Next
