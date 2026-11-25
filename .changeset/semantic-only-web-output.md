---
"@pts/web": minor
---

Breaking: `@pts/web` ships the semantic tokens only, each as its value: `tokens.css`, `tokens.js`, `tokens.scss`, and `products/*` no longer hold primitives (`--color-neutral-900`, `--dimension-16`, …) or component tokens (`--button-*`, `--switch-*`). Use the semantic token a primitive stood behind (`--inverse-base`, `--space-400`). `@pts/components` declares each component's tokens on its host instead (ADR 0079).
