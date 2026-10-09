# 0051. Emphasized Easing and Durations from Use

- Status: accepted
- Date: 2026-10-09

## What we learned

The motion tokens from ADR 0008 (`fast` 150ms, `normal` 300ms, `slow` 500ms; `standard`, `enter`, `exit`) were set from common practice, not from motion anyone had used. The owner brought the values from their own Figma prototypes:

- a tooltip on hover: 200ms;
- a dialog or bottom sheet entering: 400ms, `cubic-bezier(0.5, 0, 0, 1)`;
- a full-screen change: 600ms, the same curve.

Plotted next to the existing curves, the prototype curve belongs to the same family. `enter` (0, 0, 0, 1), `standard` (0.2, 0, 0, 1), and (0.5, 0, 0, 1) share their second control point, (0, 1), so they land the same way: fast through the middle, then a long, soft settle. Only x1 differs, which sets how long the motion holds before it goes. At 600ms the prototype curve has moved 1.7% after 60ms, is halfway at 187ms and at 90% at 340ms, and spends the last 260ms settling; its peak speed is about 4.8× linear, at 170ms. `standard` at the same duration reaches 90% at 323ms: the two end almost together, and the new curve spends its first beat holding.

Three ways to fit the durations were weighed:

- **Double at each step, 150 / 300 / 600.** A clean ratio, but 300 matches nothing used, and the dialog's 400 has no step.
- **Three steps from use, 200 / 400 / 600.** Every value used, but `normal` would stop meaning "most transitions" and become "dialogs and sheets", and `slow` would move from sheets to full screens. Changing what a name means is breaking (ADR 0014), and hover and press feedback would slow to 200ms.
- **Four steps, 150 / 200 / 400 / 600.** `fast` keeps the Button's hover and press. `normal` and `slow` keep their roles and take the values used for them; a new `slower` holds the full-screen change.

## Why it matters

- **`motion/easing/emphasized`** = `{easing.emphasized}`, a new primitive (0.5, 0, 0, 1): large moves the eye should follow, such as a dialog, sheet, or screen entering. Its description names the family and the durations it pairs with.
- **Durations from use**: `normal` 300 → 200ms (tooltips, menus), `slow` 500 → 400ms (a dialog or bottom sheet), and a new `slower` = 600ms (one screen replacing another). New primitives `duration/200`, `400`, and `600`. `fast` stays 150ms.
- **The pairing lives in the descriptions**: `slow` and `slower` say to pair with `emphasized`, and `emphasized` names them. A token holds one value, so a pair can't be a token; a `transition` composite would fix the pair where components may need to mix them.
- **One family, one axis**: the descriptions of `standard`, `enter`, and `emphasized` say they share a landing and differ in how long they hold. `exit` keeps its own curve: leaving is a different motion.
- **Docs**: the Motion page gains In use (each pair the descriptions name, played on a small screen), Curves (every easing's progress and speed over time, played at any duration), and a curve in each easing row. The Scales page's easing table shows the curve too.

### Not breaking

Six new tokens (`easing/emphasized`, `duration/200`, `400`, `600`, `motion/easing/emphasized`, `motion/duration/slower`) and two values adjusted within their roles. No token is renamed or removed: `duration/300` and `500` stay, aliased by nothing, since removing a token is breaking. A patch (ADR 0014), with a `New:` changeset that also names the two value changes.

## Trade-offs

- **Everything on `slow` moves faster**: 500 → 400ms. The Button doesn't use it; a product that does sees its dialogs and sheets enter 100ms sooner.
- **`fast` and `normal` are close** (150 and 200ms). They time different things, a state change and a small element appearing, which rarely sit side by side.
- **No emphasized exit.** Nothing used leaves with emphasis; `exit` serves every element leaving until something does.
- **Two unused primitives**, `duration/300` and `500`, until a breaking release removes them.

## Implementation notes

- `tokens/src/primitive/motion.tokens.json`: `duration/200`, `400`, `600`; `easing/emphasized` after `standard`. `tokens/src/semantic/motion.tokens.json`: the values and descriptions above.
- No lint or build change: the motion tokens are in the base set, and `npm test` checks the new ones in every output.
- Storybook: `EasingCurves`, `MotionInUse`, and `EasingPreview` in `components.tsx`, their styles in `docs.css`; the Motion and Scales pages.
- Figma: see the PR; the `Motion/` variables follow the tokens.

## Documented in

- `CLAUDE.md` — Token Rules (Primitives, Semantic → Motion)
- ADR 0008 — amended: the motion values
