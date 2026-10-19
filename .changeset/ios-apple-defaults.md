---
"@pts/web": minor
---

Breaking: iOS text follows Apple's text styles by role (body-md and label-lg are Body, 17pt; caption is Footnote) at Apple's size and leading, with the tokens' families and weights and no tracking; `PtsTextStyle` loses `tracking`, gains `leading`, and responds to Bold Text (ADR 0070).
