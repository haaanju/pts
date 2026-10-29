---
"@pts/web": patch
---

Fix: `@pts/android` and `@pts/ios` bundle Aspekta's and IBM Plex's own TrueType files, unchanged, instead of converting the web fonts, which the OFL counts as a modification that may not keep the Reserved Font Names. The families, names, and versions are the same (ADR 0076).
