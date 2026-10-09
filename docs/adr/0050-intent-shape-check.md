# 0050. Intent Shape Check

- Status: accepted
- Date: 2026-10-09

## What we learned

Every intent repeats the same eight tokens: `surface/{subtle, base, strong, stronger}`, `content/{base, inverse}`, `border/{base, subtle}` (CLAUDE.md → Color). Nothing checked it. `pts/contrast` builds its pairs from the tokens that exist (`existing()` in `tokens/lint/pairs.ts`), so a missing intent token drops out of the contrast check without a report; `pts/theme-parity` catches a token missing from one theme only.

Terrazzo has a built-in rule for this, `core/required-children` (2.7.1), unused since ADR 0021. Tried on a small token set before turning it on:

- **It pools every token a match covers.** With one match for all intents (`intent.*.surface.*`, `requiredTokens: ["strong"]`), danger's `strong` satisfied it while warning had none, and the check passed. One match per intent and part (`intent.warning.surface.*`) reported it.
- **Its message names the match by index**: `Match 12: some groups missing required token "strong"` for warning's surface, with no group and no file.
- **It checks for missing names only**, not extra ones, and sees the default theme, like every built-in rule.

## Why it matters

- **`core/required-children` is on**, with one match per intent and part: 5 intents × 3 parts = 15. `tokens/terrazzo.config.ts` writes the shape once (`INTENT_SHAPE`) and generates the matches from the intents the tokens define, so a new intent is checked with no config change.
- **Built-in over a `pts/*` rule** (ADR 0021), although a rule of our own could name the intent in its message and report extra names too. The intents rarely change, so the vague message is rarely seen, and the rule stays Terrazzo's to maintain.
- **The default theme is enough**: it checks names, and `pts/theme-parity` keeps the names the same in every theme.
- **`npm test` covers it** (ADR 0037): a copy without `intent.warning.surface.strong` must be reported. The case guards the generated matches: a config change could leave an intent uncovered.

## Trade-offs

- **Locating an error takes a step**: the index counts from 0, three matches per intent in token order (danger 0–2, discovery 3–5, info 6–8, success 9–11, warning 12–14), each surface, content, border.
- **Extra or misspelled names pass this rule.** A misspelled required name still fails it, since the required one is then missing.
- **Neutral colors aren't covered.** Their groups don't repeat, so a shape would list each token once; left out.

## Implementation notes

- `tokens/terrazzo.config.ts`: `INTENT_SHAPE`, the intents from `resolver.apply({})`, and `core/required-children` in the block of built-in rules turned on.
- `tokens/lint/rules.test.ts`: the case "an intent missing a token of the shared shape".

## Documented in

- `CLAUDE.md` — Commands, Color
- ADR 0021 — amended by this ADR
