# Biome — Linter and Formatter

## What it is

A single fast binary that replaces both ESLint (linting) and Prettier (formatting).
Written in Rust — runs in milliseconds even on large codebases.

## Why it's in StoreKit

Without a linter, subtle bugs slip through code review. Examples Biome catches:
- Unused variables that waste memory
- `==` instead of `===` (equality without type checking)
- Unreachable code after a `return`
- Imports that are never used

Without a formatter, code style drifts. Every developer writes slightly different
whitespace, quote style, trailing commas — Biome enforces one consistent style.

## Config file

`biome.json` at the project root.

## Key config choices in StoreKit

```json
{
  "linter": {
    "rules": {
      "suspicious": { "noExplicitAny": "off" },
      "style": { "noNonNullAssertion": "off" }
    }
  }
}
```

- `noExplicitAny: "off"` — Next.js App Router uses `any` in some places we inherit
- `noNonNullAssertion: "off"` — we use `!` assertions in some legacy code; this is
  gradually being eliminated as we add Zod validation

VCS integration (`vcs.useIgnoreFile: true`) means Biome automatically respects
`.gitignore` — no need to duplicate ignore patterns in `biome.json`.

## Commands

```bash
npm run lint      # check for linting errors (read-only)
npm run format    # auto-format all files
npm run check     # lint + format check in one pass (use in CI)
```

## Workflow

1. During development: run `npm run format` before committing
2. In CI: run `npm run check` — fails the build if there are issues
3. When a lint rule is noisy: disable it in `biome.json` with a comment explaining why

## Disabling a rule for one line

```ts
// biome-ignore lint/suspicious/noExplicitAny: external API response is untyped
const data = response as any
```

## Adding Biome to your editor

VS Code: install the **Biome** extension. It underlines issues in real time and
formats on save. No additional config needed — it picks up `biome.json` automatically.

## Note on Biome version

StoreKit uses Biome v2. The schema URL in `biome.json` must match the installed
version (`"$schema": "https://biomejs.dev/schemas/2.x.x/schema.json"`). The
`organizeImports` key was removed in v2 — use the `assists.actions.source.organizeImports`
path if needed.
