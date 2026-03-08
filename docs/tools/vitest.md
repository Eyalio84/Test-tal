# Vitest — Unit Test Runner

## What it is

A fast test runner built on Vite. Compatible with Jest's API — if you've
seen `describe()`, `it()`, `expect()` before, Vitest uses the same syntax.

## Why it's in StoreKit

Tests catch regressions. The most dangerous kind of regression in StoreKit
is a change to theme data that accidentally introduces duplicate images or
broken URLs. The theme tests in `tests/lib/theme.test.ts` catch this
automatically — they run the same checks as `validate-themes.ts` but in
a proper test framework with history, CI integration, and clear pass/fail reporting.

## Config file

`vitest.config.ts` at the project root.

## Setup file

`tests/setup.ts` — loads `.env.local` before any test module is imported.
This is required because `lib/r2.ts` imports `env.ts`, which validates all
env vars at module load time. Without the setup file, tests would crash
before running.

## Test files location

`tests/` directory, mirroring `lib/`:

```
tests/
  setup.ts            ← loads .env.local for all tests
  lib/
    r2.test.ts        ← tests for lib/r2.ts (r2Key)
    theme.test.ts     ← tests for lib/theme.ts (THEMES integrity)
    compress.test.ts  ← tests for lib/compress.ts
```

## Commands

```bash
npm test           # run all tests once (for CI)
npm run test:watch # re-run tests when files change (for development)
```

## Test structure

```ts
import { describe, it, expect } from "vitest"

describe("functionName", () => {
  it("does the expected thing", () => {
    const result = functionName(input)
    expect(result).toBe(expectedValue)
  })

  it("handles edge case", () => {
    expect(() => functionName(badInput)).toThrow("expected error message")
  })
})
```

## Key matchers

| Matcher | What it checks |
|---------|---------------|
| `expect(x).toBe(y)` | Strict equality (`===`) |
| `expect(x).toEqual(y)` | Deep equality (for objects/arrays) |
| `expect(x).toContain(y)` | Array or string contains y |
| `expect(x).toHaveLength(n)` | Array/string has length n |
| `expect(x).toBeGreaterThan(n)` | Number > n |
| `expect(x).toBeUndefined()` | x is undefined |
| `expect(fn).toThrow("msg")` | Function throws with this message |
| `expect(fn).rejects.toBeDefined()` | Async function rejects |

## Writing a new test

1. Create `tests/lib/yourFile.test.ts`
2. Import the function you want to test
3. Write `describe` → `it` → `expect`
4. Run `npm run test:watch` to see it pass in real time

## What to test in StoreKit

**Test (pure functions with no side effects):**
- `r2Key()` — string transformation, no env dependency
- `buildScoutPrompt()` — returns a string, verify it contains expected content
- Theme data integrity — slug uniqueness, no duplicate images
- Zod schemas — valid inputs pass, invalid inputs fail

**Don't test (require mocking too much to be useful):**
- API routes — use Playwright for end-to-end tests instead
- Database queries — integration tests with a test DB, not unit tests
- Sentry / R2 / Stripe — these are third-party services; test your code, not theirs
