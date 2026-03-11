# Haiku Parallel Session — Close P4 Batches 8-9
# Model: claude-haiku-4-5
# Branch: feature/p4-close-batches-8-9
# Coordinator session: main (Sonnet)

---

## YOUR ROLE
You are a precise TypeScript/Next.js implementer executing a well-specified plan.
You MUST work in a git branch. You MUST NOT push or merge.
You MUST NOT modify any files outside the scope listed below.

---

## STEP 0 — BRANCH SETUP (do this FIRST, before any code)

```bash
cd /root/tal-boilerplate
git checkout -b feature/p4-close-batches-8-9
```

**GATE:** Confirm branch created. Output: `git branch --show-current`
**FORBIDDEN until branch confirmed:** Any file modification.

---

## TASK OVERVIEW

Complete the final two batches of Plan #4 (Atomic Component Library).
Batches 1-7 are already done. You are implementing batches 8 and 9 only.

Full detailed spec: `docs/plans/BATCH_8_9_DETAILED.md`
Context on what was built: `docs/plans/2026-03-09-p4-extended-component-library.md`

---

## BATCH 8 — Task 5.1: SVG Component Preview Images

### What to build
A script that generates SVG thumbnail previews for each component and uploads them to R2.
The component data lives in the database (`Component` table).

### Files to create/modify
- CREATE: `lib/component-preview.ts` — SVG generation utility
- CREATE: `scripts/generate-component-previews.ts` — run once, reads DB, uploads to R2
- MODIFY: `prisma/schema.prisma` — verify `previewImage String?` field exists on Component model

### Reference implementation
Read `docs/plans/BATCH_8_9_DETAILED.md` — Task 5.1 has the full SVG template and script structure.
The R2 upload pattern is in `lib/r2.ts` (`r2Key()`, `r2Url()`, R2 client).
The image compression pattern is in `lib/compress.ts` (use for SVG → WebP if needed, else upload SVG directly).

### Category color map (use these exactly)
```typescript
const categoryColors: Record<string, string> = {
  button: '#3B82F6',
  input: '#10B981',
  card: '#F59E0B',
  overlay: '#8B5CF6',
  nav: '#EC4899',
  section: '#06B6D4',
  badge: '#14B8A6',
  modal: '#EF4444',
  dropdown: '#6366F1',
  slider: '#84CC16',
};
```

### R2 key pattern
`components/previews/{slug}.svg`

### Script entry point
```typescript
// scripts/generate-component-previews.ts
import "dotenv/config"; // MUST be first import
```

### Verification
```bash
npx tsc --noEmit  # must pass
```

---

## BATCH 8 — Task 5.2: Smoke Test

### What to test
1. Component palette renders in the editor without errors
2. Drag-to-place fires the canvas store action
3. Aria "add [componentAriaName]" resolves to the correct component from the registry

### Files to create
- CREATE: `tests/lib/component-palette.test.ts`

### Test patterns to follow
- Look at `tests/lib/r2.test.ts` and `tests/lib/theme.test.ts` for import patterns
- Use `vi.mock` for DB calls (Prisma client mock)
- Use static imports — NOT dynamic imports in tests (known caveat from Haiku benchmark T3)
- All mocks at top of file, before any test blocks

### Minimum test cases (write all 3)
```typescript
// 1. generateComponentPreviewSVG returns valid SVG string
// 2. component slug is unique (from static test fixture array)
// 3. ariaName maps correctly to slug in a mock registry lookup
```

---

## BATCH 9 — Task 6.1: Integration Tests

### What to test
End-to-end flow: component palette → canvas add → save to SiteContent draft → publish

### Files to create
- CREATE: `tests/lib/component-integration.test.ts`

### Scope
- Test that adding a component to the canvas updates the Zustand canvas store
- Test that the canvas state serializes correctly to the SiteContent `draft` JSON format
- Test the save API route handler with a mocked DB call
- Do NOT test actual DB writes — mock Prisma at the module level

### Reference files to read before writing tests
- `store/aria.ts` — Zustand store shape
- `app/api/media/images/route.ts` — existing API route pattern to follow for handler tests

---

## VERIFICATION CHECKLIST (run before declaring done)

```bash
# From /root/tal-boilerplate on branch feature/p4-close-batches-8-9

npx tsc --noEmit          # MUST pass — zero TypeScript errors
npm test                  # MUST pass — all tests green (existing 55 + new batch 8-9 tests)
npm run lint              # REVIEW warnings, FIX errors
git diff --stat main      # MUST show only the files listed above — no extra changes
```

**GATE — Output these results before finishing:**
1. `npx tsc --noEmit` exit code and output
2. `npm test` — total pass/fail count
3. `git diff --stat main` — list of changed files

---

## WHAT NOT TO DO

- **FORBIDDEN:** Push to remote (`git push`)
- **FORBIDDEN:** Merge into main (`git merge`, `git rebase`)
- **FORBIDDEN:** Modify any file not listed in this plan
- **FORBIDDEN:** Create new Prisma migrations (schema changes should be minimal/none)
- **FORBIDDEN:** Install new npm packages without checking CLAUDE.md first

---

## OUTPUT WHEN DONE

When all verification checks pass, output this summary:

```
## Batch 8-9 Complete
Branch: feature/p4-close-batches-8-9

Files created:
- lib/component-preview.ts
- scripts/generate-component-previews.ts
- tests/lib/component-palette.test.ts
- tests/lib/component-integration.test.ts

TypeScript: PASS (0 errors)
Tests: [N] passing, 0 failing
Lint: [summary]

Ready for coordinator review and merge.
```
