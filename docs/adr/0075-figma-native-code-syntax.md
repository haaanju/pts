# 0075. Figma Code Syntax for Android and iOS

- Status: proposed
- Date: 2026-10-28

## Decision

Chosen: every Figma variable whose token `@pts/android` and `@pts/ios` emit carries an ANDROID and an iOS code syntax beside its WEB one, the iOS static member (`PtsColors.surfaceSubtle`) and, on Android, the property on the instance an app picks per mode (`colors.surfaceSubtle`), because Dev Mode showed only the CSS name while two more platforms read the same tokens.

## What we learned

Figma's code syntax is one string per variable and platform (WEB, ANDROID, iOS), shown in Dev Mode for the platform the reader picks; it can't differ by mode. Code Connect, which would show a component's code, needs an Organization or Enterprise plan, and the `pts` file is on Pro (checked 2026-10-28); code syntax works on every plan.

The native outputs hold 109 tokens, the same names on both platforms: the semantic colors (60), the space scale, padding, gaps, and icon and control sizes (34), and the radius, strokes, and focus ring (15). Primitives, the component tier, the typography properties, motion, elevation, and layout have no native counterpart; text styles take no code syntax in Figma.

On iOS each class is an `enum` of static members, so `PtsColors.surfaceSubtle` is the code itself. On Android each class is instantiated once per mode (`PtsColors.Light`, `PtsColors.Dark`), and an app picks one, so the code reads a property of that instance. Options for Android:

- **The instance an app picks**, named as in the README (`colors.surfaceSubtle`, `spacing.paddingMd`, `border.radiusControl`): chosen (owner, 2026-10-28). Valid Kotlin whatever the mode.
- **The class and the property** (`PtsColors.surfaceSubtle`): the same shape as iOS, but it doesn't compile, since the properties belong to an instance.
- **The property alone** (`surfaceSubtle`): the shortest, but it doesn't say which class holds it.
- **One mode's value** (`PtsColors.Light.surfaceSubtle`): wrong for every other mode, and code syntax can't vary by mode.

## Why it matters

- **Dev Mode shows each platform its own name**: an Android or iOS developer reads the property to type, not the CSS name to translate.
- **The names match the code by construction**: the script takes them from the built Kotlin and Swift, so a variable whose name doesn't map to a property gets none rather than a guess.

## Trade-offs

- **The Android prefix is a convention, not an API**: `colors`, `spacing`, and `border` are what the README names the instances; an app may name them otherwise. The README example now picks `border` too, so all three appear there.
- **Kept by hand, like the rest of Figma**: a token renamed or added in a native class needs its code syntax set again (the `figma` skill).

## Implementation notes

- Checked: the 109 Kotlin properties of `PtsColors`, `PtsSpacing`, and `PtsBorder` and the 109 Swift static members of the same classes have the same names.

## Documented in

- `.claude/skills/figma/SKILL.md`: Variables
- `README.md`: Android (the `border` instance)
