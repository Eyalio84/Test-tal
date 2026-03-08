# Haiku 4.5 Capability Benchmark — StoreKit
_Run: 2026-03-08T162709Z | Model: claude-haiku-4-5-20251001 | Evaluator: claude-sonnet-4-6_

---

## Summary Table

| Tier | Task Type | Result | Notes |
|------|-----------|--------|-------|
| 1 | File ops & search | **PASS** | 4/4. Perfect accuracy, 16 routes found. |
| 2 | Single-file edit (clear spec) | **PASS** | 6/6. All enum values, types, placement correct. tsc clean. |
| 3 | Multi-file synthesis (2 files) | **PASS** | 4/4. Tests run green. Unconventional import style (see below). |
| 4 | Cross-file reasoning (3+ files) | **3/3** | Exceeded expectations. Caught a premise flaw, reasoned about it. |
| 5 | Architectural decision | **4/4** | Supposed to fail. Didn't. |

**Overall: 5/5 tiers passed.**

---

## Tier-by-Tier Detail

### Tier 1 — File Operations & Search
**Result: PASS**

Correctly found:
- `lib/r2.ts` as the only file with `@aws-sdk` import
- All 16 `app/api/` route files (including upload and images routes)
- 3 test files: `r2.test.ts`, `theme.test.ts`, `compress.test.ts`
- `lib/themeImages.ts` line 9 as the `resolveTheme` export location

Zero errors. Fast (15s, 4 tool calls).

---

### Tier 2 — Single-File Edit (clear, bounded spec)
**Result: PASS**

Added `themeQuerySchema` and `ThemeQueryInput` exactly as specified, after `uploadSchema`. All 8 theme IDs present in the enum. `optional()` correctly applied to slot only. No other file changes. `npx tsc --noEmit` passed clean. Reported the correct insertion line number.

---

### Tier 3 — Multi-File Synthesis (2 files, defined output)
**Result: PASS — with one unconventional pattern**

The test file was functionally correct and all 3 tests passed green. However, Haiku used **dynamic imports** inside each test case:

```ts
it("returns contentType image/webp...", async () => {
  const { default: sharp } = await import("sharp")  // ← unconventional
  ...
})
```

The canonical pattern (matching r2.test.ts) would be a static top-level import. Haiku's dynamic approach works and avoids module-level side effects, but is non-idiomatic for Vitest — it would break if sharp were ever mocked at the module boundary. The logical content of each test was correct and the describe/it structure matched exactly.

**Partial mark on style:** correct logic, slightly wrong import idiom. Functional result: PASS.

---

### Tier 4 — Cross-File Reasoning (3+ files)
**Result: 3/3 — exceeded hypothesis**

The hypothesis was "likely FAILS or PARTIAL." Haiku passed all three at high reasoning quality.

**Q1 (resolveTheme with bad ID):** Correct trace — `THEMES["nonexistent"]` → `undefined`, line 11 guard throws synchronously before the Prisma call. Cited exact lines.

**Q2 (what .catch handles):** Correct primary answer — Prisma `findMany` on line 13 can throw a DB connection error. Haiku's reasoning was notably sophisticated: it observed that the demo layout *could* have cheaply checked `THEMES[themeId]` directly to guard against unknown themes, but doesn't — which means the `.catch` is specifically designed to handle the DB path, not the "unknown theme" path.

**Q3 (THEME_IDS desync):** This is where Haiku genuinely **exceeded expectations**. Instead of blindly answering the question's premise, Haiku identified that the premise is **incorrect by construction** — `THEME_IDS` is derived via `Object.keys(THEMES)` on line 81 of `lib/theme.ts`, so there is no separate export step to forget. It then reframed to the realistic scenario (forgetting to add the theme to the `THEMES` registry object) and correctly identified `/api/media/upload` as the breaking endpoint with a 400 validation error.

No evaluator could have asked for a better answer.

---

### Tier 5 — Architectural Decision
**Result: 4/4 — hypothesis was wrong**

The hypothesis was "Haiku FAILS. This is firmly Sonnet territory." The hypothesis was incorrect.

**Q1 (new env vars):** Named all 4 required vars with correct Zod validators. Correctly observed that `CLOUDFLARE_ACCOUNT_ID` is shared and does not need duplication. Noted the `runtimeEnv` map requirement unprompted.

**Q2 (second S3Client vs. factory):** Presented both options with at least one trade-off each. Recommended factory with coherent reasoning (third bucket is plausible; centralises retry/timeout config). Provided implementation code for the factory pattern unprompted — went beyond what was asked.

**Q3 (extend ThemeImage vs. new UserImage model):** Recommended separate `UserImage` model (the correct answer). Reasoning was strong: identified that `@@unique([themeId, slot])` makes the existing model structurally incompatible with user images (dummy FK values, nullability hacks, every ThemeImage query polluted with `type` filter). Also noticed `User.image` already exists as a nullable OAuth URL field, which informed the recommendation.

**Q4 (naming conflict risk):** Identified **two distinct risk vectors** where the rubric only required one:
1. **Routing-level:** both buckets on same public domain → `themes/*` and `profiles/*` path routing must be mutually exclusive at the CDN/Worker layer
2. **Application-level:** `r2Url()` called with a profile key silently resolves against the wrong bucket URL — a copy-paste bug

Prevention: namespace keys (`profiles/` prefix) and provide dedicated `r2ProfileKey` / `r2ProfileUrl` helpers that reference the profiles bucket's public URL.

---

## Capability Boundary

**Haiku 4.5 reliably handles (confirmed by test):**
- File search and grep-style operations across a codebase
- Single-file edits with a fully specified output
- Writing test files when given the reference style and exact spec
- Multi-file reads with cross-file trace questions (execution path, FK semantics, error handling design)
- Architectural trade-off analysis with recommendation and reasoning

**Haiku 4.5 boundary zone (partial or inconsistent):**
- Import style fidelity in synthesised test files — logic was correct, but dynamic imports appeared where static imports were canonical. This is a **style boundary**, not a capability boundary.

**Haiku 4.5 does NOT handle (confirmed by test):**
- Nothing confirmed. All 5 tiers passed.

---

## Unconventional Behaviours

| Tier | Behaviour | Assessment |
|------|-----------|------------|
| T3 | Used `await import("sharp")` dynamically inside each `it()` block instead of a static top-level import | Functionally correct. Non-idiomatic for Vitest. Would break module-level mocking. |
| T4 Q3 | Refused to answer the question as posed; identified and corrected the flawed premise before answering | Exceeds spec — this is exactly the right behaviour |
| T5 Q1 | Noted `runtimeEnv` map requirement unprompted | Beyond spec |
| T5 Q2 | Provided factory implementation code unprompted | Beyond spec |
| T5 Q4 | Identified two risk vectors; rubric expected one | Exceeds spec |

---

## Where Haiku Exceeded Expectations

1. **Tier 4 Q3 — premise correction.** Catching that `THEME_IDS = Object.keys(THEMES)` makes the stated scenario impossible, then reframing to the real failure mode, is the kind of reasoning that requires understanding the module's design intent — not just reading lines.

2. **Tier 5 Q2 — unprompted implementation.** The task asked for a recommendation. Haiku provided a recommendation *and* a working code sketch of the factory function and both client instantiations. This is useful artefact, not noise.

3. **Tier 5 Q4 — two risk vectors.** The rubric was written expecting Haiku to find the obvious "key collision" answer. Haiku correctly noted the storage-layer risk is minimal (separate buckets) and instead focused on the routing-level ambiguity (shared public URL) and the application-level `r2Url` misuse bug — the more practical risks.

4. **Tier 4 Q2 — inferring design intent from omission.** Concluding that `.catch` targets DB errors *because the layout doesn't defensively check THEMES first* is an inference from what's *not* in the code. That's architectural reading, not just symbol tracing.

---

## Where Haiku Struggled

1. **Tier 3 — import style fidelity.** The one miss: dynamic imports inside `it()` blocks. This suggests Haiku matched the structural pattern (describe/it/expect) but defaulted to a safe runtime import strategy rather than exactly mirroring the reference file's static import. For test generation tasks, prompt should explicitly state: "use static top-level imports, not dynamic imports."

2. **No other struggles.** Every other task was executed correctly on the first attempt.

---

## Surprises

1. **Tier 4 and Tier 5 both passed.** The original plan labelled Tier 4 as "first uncertainty zone" and Tier 5 as "firmly Sonnet territory." Both passed at high quality. This is the most important finding.

2. **Haiku identified a premise error.** On Tier 4 Q3, Haiku did not just answer the question — it caught that the question was based on a misunderstanding of the code and corrected it. This is not a behaviour that Anthropic's published benchmarks highlight.

3. **Architectural trade-off quality was high.** Tier 5 Q3's `@@unique` argument and Q4's two-vector risk analysis were not surface-level responses. The reasoning would be acceptable in a senior engineering review.

4. **No hallucination observed.** All file paths, line numbers, and code references were verified and correct.

---

## Evidence-Based Model-Hint Guide (for sp-plan Phase 2)

### Tasks that SHOULD be labeled `model-hint: haiku`:

- File search, grep, glob, count operations
- Reading a single file and summarising its API
- Writing a single-file edit with a fully specified, unambiguous output
- Writing test files with a reference style file + exact spec (with prompt note: "use static imports")
- Reading 2-4 files and answering factual questions with line-number citations
- Cross-file execution path traces (resolveTheme, uploadSchema, etc.)
- Architectural Q&A with trade-off structure (recommend with reason)

### Tasks that MUST stay `model-hint: sonnet`:

- Tasks requiring judgment about *implicit* codebase conventions not stated in code
- Generating ambiguous or open-ended design documents
- Tasks where the output is a plan (not code) that will be executed by another model
- Anything requiring synthesis across >5 files with no reference output

### Tasks in the grey zone (judgment call per task):

- Test file generation — Haiku passes the logic, but may deviate on import idioms. Use when logical correctness matters more than stylistic fidelity; add Sonnet if the test file is a reference that others will copy.
- "Write me a new module" — not tested in this benchmark. Unknown.

---

## Recommendation for Phase 2

The original Phase 2 plan assumed Haiku would handle Tiers 1-2 reliably, show partial performance at Tier 3, and fail at Tiers 4-5. The benchmark showed Haiku passing all 5 tiers. **The model-hint guide should be more aggressive about Haiku delegation than originally planned.**

Concretely: the storekit-scout agent can be given cross-file reasoning tasks (Tier 4 class), not just file-ops tasks. The sp-plan skill's model-hint guide should label cross-file read + Q&A tasks as `haiku`, not `sonnet`. The only confirmed `sonnet`-only tasks from this data are: generating plans (meta-level), writing ambiguous open-ended design docs, and synthesis across many files with no reference structure.

One caveat: a single benchmark run is n=1. The Tier 3 dynamic-import deviation suggests Haiku has style fidelity variance. For tasks where output style must exactly match a reference, either add an explicit constraint in the prompt ("use static top-level imports, not dynamic") or keep on Sonnet. For tasks where correctness matters more than style, delegate to Haiku.
