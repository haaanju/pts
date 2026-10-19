---
"@pts/web": patch
---

New: iOS type in `@pts/ios`: `PtsTypography`, every text style in Aspekta or IBM Plex at the size of the iOS text style it names in `$extensions` (new on each `text/*` token), scaled by Dynamic Type, and `PtsFonts`, the bundled fonts; a lint rule, `pts/ios-text-style`, checks every text style names one (ADR 0066).
