---
"@pts/web": patch
---

New: a `shape` modifier (`soft`, the default, and `round`) and the `radius/control` token it sets: 8px (`radius/md`) in soft, fully rounded (`radius/full`) in round. `tokens.css` adds `[data-shape="soft"|"round"]` blocks, which work on any element like `data-density`. `button/radius` now aliases `radius/control`, so it is still 8px by default and a pill in round. The example product `roomy-app` fixes `shape: round` and `dense-app` `shape: soft`, so their JS `apply()` takes a `shape` input too (ADR 0048).
