---
"@pts/web": minor
---

Breaking: the `lg` button size is removed: `button/lg/*` (height, padding, gap, icon, label) is gone, and `<pts-button size="lg">` falls back to `md`. Use `md`, in relaxed density for a larger button (ADR 0053).
