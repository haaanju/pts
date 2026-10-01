# 0022. Terrazzo over Style Dictionary

- Status: accepted
- Date: 2026-09-27

## What we learned

ADR 0003 adopted Terrazzo for the first CSS build without recording the alternative. The main one is Style Dictionary, the most widely used token build tool, used in an earlier project before this one. The comparison, made after the pipeline gained a resolver, a hand-edited source, and CI gates:

| | Terrazzo (2.7) | Style Dictionary (5.5) |
|---|---|---|
| Input | DTCG only, validated strictly by the parser | Its own format or DTCG; custom parsers for anything else |
| DTCG 2025.10 values (color objects, `{ value, unit }` dimensions) | Native | Partial, depending on transforms |
| Themes | The DTCG resolver (`modifiers.theme`) and `permutations` in one build | No resolver support; one build per theme, with the file sets passed by hand |
| Extension model | A plugin owns its transforms and output | Transforms, transform groups, formats, filters, actions, preprocessors, configured separately |
| Lint | Built in (`core/*`, `a11y/*` rules) | None; custom scripts |
| Outputs | Web-first: CSS, JS, CSS-in-JS, Tailwind; Swift at 0.x; no Android | Wide: CSS, SCSS, JS, iOS Swift, Android XML and Compose, Flutter |
| Figma | None; Figma variables are maintained by hand | Usually paired with Tokens Studio and `@tokens-studio/sd-transforms` |
| Ecosystem | Small, mostly one maintainer | Large, many production references |

The earlier Style Dictionary setup was hard to maintain: themes, transforms, and formats were all configuration spread across files. Its usual Figma pairing, Tokens Studio, is a separate plugin rather than native Figma: designers learn a second tool, and the pipeline depends on it. Figma variables don't cover everything yet, but more of what Tokens Studio adds is moving into Figma itself.

## Why it matters

- **Terrazzo stays the build tool.** The source is hand-edited DTCG (ADR 0020), so a parser that rejects invalid tokens is the first check. The resolver keeps light and dark in one source and one build. Built-in lint can take over checks now in `check.ts` (ADR 0021, in progress).
- **Figma stays a consumer through native variables**, with no Tokens Studio. Updates are manual until Figma or the tooling offers a native sync (see Deferred in `CLAUDE.md`).
- **Known gap: native outputs.** There is no official Android plugin, and `@terrazzo/plugin-swift` is pre-1.0. When native platforms start, write a custom Terrazzo plugin (`transform` maps values to platform types, `build` writes files) instead of adding Style Dictionary next to Terrazzo. A second tool would need its own theme wiring, since it can't read the resolver.
- **The hard part of native outputs is platform meaning, not the tool.** Shadows don't map one-to-one onto Android elevation, px letter spacing needs converting, and fonts are bundled per platform. Style Dictionary's built-in Android formats leave these to custom code too.
- **The source stays portable.** Tokens are standard DTCG with a standard resolver, so switching tools later means rewriting the build config, not the tokens.

## Implementation notes

- Nothing changes in the code. `packages/web/terrazzo.config.ts` stays as is.
- Checked on 2026-10-01: `@terrazzo/plugin-swift` 0.3.3 ("still experimental" in its docs) transforms `color` only (`// TODO: other types`) into an `.xcassets` catalog, and takes the dark appearance from `token.mode` (`$extensions.mode`), which this repository doesn't use, so with the resolver it would likely emit light colors only. Terrazzo's integrations list has no Android, Kotlin, Compose, or Flutter plugin. A custom plugin remains the plan; the Swift plugin is a short reference for the plugin structure.
- Revisit if an official Terrazzo Android plugin ships, or if a custom plugin turns out to cost more than a Style Dictionary build for that platform.

## Documented in

- `CLAUDE.md` — Deferred
- `docs/progress.md` — Next
