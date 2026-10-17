---
"@pts/web": patch
---

Fix: `PtsColors.kt` compiles. A description with `/*` (such as `content/inverse/*`) opened a nested comment inside its KDoc; the Compose plugin now escapes comment markers (ADR 0057).
