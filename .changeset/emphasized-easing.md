---
"@pts/web": patch
---

New: `motion/easing/emphasized` (0.5, 0, 0, 1) for dialogs, sheets, and screen changes, and `motion/duration/slower` (600ms) for full-screen transitions. Fix: `motion/duration/normal` is 200ms (was 300) and `motion/duration/slow` 400ms (was 500), the values used for tooltips and for dialogs and sheets. New primitives `easing/emphasized` and `duration/200`, `400`, `600` (ADR 0051).
