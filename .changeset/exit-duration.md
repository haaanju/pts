---
"@pts/web": patch
---

Fix: `motion/easing/exit`'s description says to leave one duration step shorter than the element entered (a tooltip leaves over `fast`, a sheet over `normal`), and that going back to a screen is a screen change, not an exit (ADR 0051).
