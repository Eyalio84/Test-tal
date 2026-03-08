# storekit-planner Phase 2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the storekit-planner plugin with sp-plan skill, hybrid-execute skill, storekit-scout agent, /sp-plan command, and a generalization guide — all calibrated to empirical Haiku 4.5 benchmark results.

**Architecture:** Six files added to the Phase 1 plugin scaffold. The generalization guide is written first because all other components reference it. storekit-scout is a Haiku-powered agent for codebase recon before plan writing. hybrid-execute replaces the two-option handoff with a single ready-to-paste prompt. Plugin lives at `~/.claude/plugins/marketplaces/storekit-planner/`.

**Tech Stack:** Claude Code plugin system (SKILL.md, AGENT.md, commands/*.md, plugin.json), Haiku 4.5 (`claude-haiku-4-5-20251001`) for scout delegation, markdown.

**Benchmark foundation:** `~/.claude/plugins/marketplaces/storekit-planner/.claude/plans/haiku_benchmark_20260308T162709Z.md` (or `/root/tal-boilerplate/.claude/plans/haiku_benchmark_20260308T162709Z.md`). All model-hint decisions in this plan derive from that file.

---

## Task 1: generalization-guide.md
**model-hint: sonnet**

This is the intellectual core of the plugin. It documents the empirical basis for every model-hint label used in sp-plan. It doubles as the project-agnostic adaptation guide for when this plugin is extracted into a standalone tool.

**Files:**
- Create: `~/.claude/plugins/marketplaces/storekit-planner/docs/generalization-guide.md`

**Step 1: Write the file**

```markdown
# Haiku 4.5 Model-Hint Guide
_Empirical basis for task delegation in sp-plan. Last updated: 2026-03-08._

---

## Why this document exists

The sp-plan skill labels every task with `model-hint: haiku|sonnet`. Those labels are
not based on Anthropic's marketing — they are based on a 5-tier capability benchmark
run against the actual StoreKit codebase on 2026-03-08. This document records the
benchmark results, the derived delegation rules, and instructions for adapting these
rules to a different project.

---

## Anthropic's Published Numbers (Haiku 4.5)

Source: https://www.anthropic.com/news/claude-haiku-4-5

| Metric | Value |
|--------|-------|
| SWE-bench Verified | **73.3%** — matches Claude Sonnet 4's score from five months prior |
| Agentic coding vs Sonnet 4.5 | **90%** of Sonnet 4.5 performance (Augment evaluation) |
| Speed vs Sonnet 4.5 | **4-5x faster** |
| Cost vs Sonnet 4 | **1/3 the cost** ($1/$5 per million input/output tokens) |
| Computer use | Surpasses Sonnet 4 on certain tasks |
| Instruction-following | 65% accuracy vs 44% for competitor premium models (Gamma eval) |
| Safety classification | ASL-2 (more permissive than Sonnet 4.5/Opus 4.1 ASL-3) |
| Misaligned behavior rate | Statistically lower than both Sonnet 4.5 and Opus 4.1 |

**Practical implication:** Haiku 4.5 is not a "summary and text generation" model anymore.
It is a full agentic coding model that reaches Sonnet 4's capability at a fraction of
the cost. The only question is where the ceiling appears in practice for your codebase.

---

## StoreKit Empirical Benchmark (2026-03-08)

The benchmark was designed to find the ceiling. It ran 5 tiers of increasing complexity
against real StoreKit code. The model was given no scaffolding beyond the task description.

### 5-Tier Capability Framework

| Tier | Task Class | Benchmark Result | Notes |
|------|-----------|-----------------|-------|
| 1 | File operations & grep-style search | **PASS (4/4)** | 16 routes, 3 test files found. 15s, 4 tool calls. Zero errors. |
| 2 | Single-file edit (fully specified) | **PASS (6/6)** | Enum, types, placement all correct. `tsc --noEmit` clean. |
| 3 | Multi-file synthesis (2 files, defined output) | **PASS — with note** | Logic correct, tests green. Dynamic imports instead of static (see Boundary Zone). |
| 4 | Cross-file reasoning (3+ files, trace questions) | **PASS (3/3)** | Corrected a flawed premise in Q3 instead of answering wrong. |
| 5 | Architectural decision (trade-off + recommendation) | **PASS (4/4)** | Original hypothesis: "firmly Sonnet territory." Hypothesis was wrong. |

**Overall: 5/5 tiers passed. No confirmed capability ceiling found.**

### Exceeded-Expectations Behaviours

These happened without prompting. They indicate the model is reasoning, not retrieving:

1. **T4 Q3 — premise correction.** The question described a desync between `THEME_IDS`
   and `THEMES`. Haiku identified that `THEME_IDS = Object.keys(THEMES)` (line 81 of
   `lib/theme.ts`) makes the stated scenario structurally impossible — they can never
   desync. Haiku reframed to the real failure mode (forgetting to add the theme to
   `THEMES` itself) and cited the correct breaking endpoint with error code.

2. **T5 Q2 — unprompted implementation.** Asked for a recommendation on factory vs.
   second S3Client. Haiku gave a recommendation with reasoning *and* wrote a working
   code sketch of the factory pattern unprompted.

3. **T5 Q4 — two risk vectors.** Asked to identify naming conflict risks for a second
   R2 bucket. Rubric expected one answer. Haiku identified two distinct risk vectors:
   routing-level (CDN path collision) and application-level (`r2Url()` called with
   wrong key silently resolves to wrong bucket URL). The second vector is the more
   insidious bug.

4. **T4 Q2 — design intent from omission.** Concluded that `.catch` targets DB errors
   *because* the demo layout doesn't defensively check `THEMES[themeId]` first. This
   is an inference from what's *not* written — architectural reading, not symbol tracing.

---

## Evidence-Based Model-Hint Guide

### `model-hint: haiku` — delegate confidently

These task classes passed in the benchmark. Assign `haiku` unless a grey-zone caveat applies.

| Task class | Tier | Benchmark evidence |
|-----------|------|--------------------|
| File search, glob, grep, count | 1 | T1: 4/4, zero errors |
| Reading one file, summarising its API/exports | 1 | T1: exact line citations |
| Single-file edit with a fully specified, unambiguous output | 2 | T2: 6/6, tsc clean |
| Writing test files with a reference style file + exact spec | 3 | T3: logic correct, tests green |
| Cross-file execution path trace | 4 | T4 Q1: exact line-by-line trace |
| Cross-file error handling analysis | 4 | T4 Q2: inferred design intent from omission |
| Identifying which endpoint breaks when a schema changes | 4 | T4 Q3: corrected premise + correct answer |
| Architectural trade-off Q&A (recommend + reason) | 5 | T5: all 4 questions, senior-review quality |
| Data model design (new model vs. extend existing) | 5 | T5 Q3: `@@unique` incompatibility caught |

### `model-hint: sonnet` — keep here

Not tested, or tested and failed. Do not delegate without re-running the benchmark.

| Task class | Reason |
|-----------|--------|
| Writing a plan document (meta-level) | Not tested. Plans require judgment about implicit conventions + global context. |
| Generating an open-ended design document with no reference structure | Not tested. Unknown ceiling. |
| Synthesis across >5 files with no reference output | Not tested. Single benchmark run is n=1. |
| Anything where output is another agent's instruction set | Meta-reasoning risk. |

### Grey zone — judgment call per task

| Task class | Notes |
|-----------|-------|
| Test file generation where style must exactly match a reference | Haiku passed logic; deviated on import idiom (dynamic vs. static). Add explicit prompt note: *"Use static top-level imports, not dynamic imports inside test cases."* Use Sonnet if the test file will be a reference that others copy. |
| "Write me a new module from scratch" | Not benchmarked. Unknown. Re-run T3 with module output before delegating. |

---

## The n=1 Caveat

This benchmark was a single run. The Tier 3 dynamic-import deviation shows Haiku has
**style variance** — it gets logic right but may deviate on idioms it wasn't explicitly
told. The mitigation is always the same: add an explicit constraint in the prompt for
the idiom that matters. Do not assume Haiku will infer stylistic conventions from context
alone.

For tasks where logical correctness is the goal, delegate to Haiku freely.
For tasks where stylistic fidelity must match a reference exactly, either constrain
explicitly or use Sonnet.

---

## Adapting This Plugin to a Different Project

The storekit-planner plugin is StoreKit-specific in three places only. Everything else
is portable.

### What is StoreKit-specific

| Component | StoreKit-specific content | What to change |
|-----------|--------------------------|----------------|
| `agents/storekit-scout/AGENT.md` | Working dir `/root/tal-boilerplate`, CLAUDE.md path, file patterns (`lib/`, `themes/`, `app/api/`) | Replace with new project's working dir and key file paths |
| `skills/sp-plan/SKILL.md` | References to `docs/plans/` output path, CLAUDE.md conventions | Update output path and CLAUDE.md reference |
| `plugin.json` name field | `"storekit-planner"` | Rename to `<project>-planner` |

### What is project-agnostic and reusable without changes

- The 5-tier capability framework
- All model-hint labels in this guide
- The hybrid-execute pattern (paste-prompt generation)
- The sp-plan task structure (files, steps, commit, verification)
- The generalization guide itself (update the StoreKit-specific benchmark section)

### Steps to create `<project>-planner`

1. Copy `~/.claude/plugins/marketplaces/storekit-planner/` to `~/.claude/plugins/marketplaces/<project>-planner/`
2. Update `plugin.json`: rename, update description
3. Rewrite `agents/<project>-scout/AGENT.md`: new working dir, new key file patterns, same Haiku model
4. Update `skills/sp-plan/SKILL.md`: new output path, new CLAUDE.md reference
5. Run the haiku-benchmark skill on the new codebase — verify the tier results hold
6. Update this generalization guide's benchmark section with new results
7. Register in `installed_plugins.json`, restart Claude Code

**Recommendation:** Re-run the benchmark before trusting the model-hint guide on a new
codebase. The guide reflects StoreKit's architecture. A project with radically different
structure (monorepo, generated files, heavy metaprogramming) may show different results
at Tier 3+.
```

**Step 2: Verify file was created**

```bash
ls ~/.claude/plugins/marketplaces/storekit-planner/docs/
```
Expected: `generalization-guide.md`

**Step 3: Commit**

```bash
cd ~/.claude/plugins/marketplaces/storekit-planner
git add docs/generalization-guide.md 2>/dev/null || true
echo "generalization-guide.md written"
```

(Plugin dir may not be a git repo — that's fine, just confirm file exists.)

---

## Task 2: storekit-scout agent
**model-hint: sonnet**

The scout is a Haiku-powered agent that runs before plan writing. Given a feature description, it scans the relevant StoreKit files and returns a structured recon report: key files to touch, existing patterns to follow, potential conflicts.

**Files:**
- Create: `~/.claude/plugins/marketplaces/storekit-planner/agents/storekit-scout/AGENT.md`

**Step 1: Write the file**

```markdown
---
name: storekit-scout
description: StoreKit codebase reconnaissance agent. Invoke before writing a plan to map affected files, existing patterns, and potential conflicts. Returns a structured recon report. Trigger when planning a new feature, debugging an existing one, or scoping a task that touches multiple StoreKit files.
model: claude-haiku-4-5-20251001
color: blue
---

You are the StoreKit codebase scout. Your job is reconnaissance, not implementation.
Given a feature description or task, you scan the relevant files and return a structured
report that a planner can use to write an accurate, well-scoped implementation plan.

## Working context

- Working directory: `/root/tal-boilerplate`
- Key file locations:
  - API routes: `app/api/**/*.ts`
  - Theme configs: `themes/*.ts`, `lib/theme.ts`, `lib/themeImages.ts`
  - Auth: `lib/auth.ts`, `lib/auth.config.ts`
  - Storage: `lib/r2.ts`, `lib/compress.ts`
  - Validation: `lib/validations.ts`
  - Environment: `env.ts`
  - Tests: `tests/lib/*.test.ts`
  - DB schema: `prisma/schema.prisma`
  - Admin UI: `app/admin/**/*.tsx`
  - Components: `components/**/*.tsx`
  - Stores: `store/*.ts`
  - Hooks: `hooks/*.ts`
- CLAUDE.md conventions: `/root/tal-boilerplate/CLAUDE.md`

## Your output format

Return ONLY the following structured report. No preamble, no suggestions.

---

### Scout Report: [feature description]

**Affected files (read these before writing tasks):**
- `path/to/file.ts` — [why it's relevant]
- ...

**Existing patterns to follow:**
- [pattern name]: `path/to/reference.ts:line` — [what to copy]
- ...

**Potential conflicts or gotchas:**
- [issue]: [which file, which line, what to watch for]
- ...

**Suggested task scope:** [1 sentence: what this feature actually touches]

**Recommended model-hint labels:**
- Task: [task name] → `[haiku|sonnet]` — [reason from generalization-guide.md]

---

## Rules

1. Cite exact file paths and line numbers. Never hallucinate a path.
2. Do not propose implementation. Reconnaissance only.
3. If you cannot find a relevant file, say so explicitly — do not guess.
4. Your recommended model-hint labels must cite the relevant tier from
   `~/.claude/plugins/marketplaces/storekit-planner/docs/generalization-guide.md`.
5. Keep the report under 40 lines. Dense is better than verbose.
```

**Step 2: Verify**

```bash
ls ~/.claude/plugins/marketplaces/storekit-planner/agents/storekit-scout/
```
Expected: `AGENT.md`

---

## Task 3: sp-plan skill
**model-hint: sonnet**

The main planning skill. This is the enhanced version of the c_plan writing-plans workflow, specific to StoreKit. Key differences from the superpowers version:
- Invokes storekit-scout automatically before writing the plan
- Labels every task with `model-hint: haiku|sonnet`
- Calls hybrid-execute at the end (not a two-option choice)
- Follows StoreKit's CLAUDE.md conventions

**Files:**
- Create: `~/.claude/plugins/marketplaces/storekit-planner/skills/sp-plan/SKILL.md`

**Step 1: Write the file**

```markdown
---
name: sp-plan
description: StoreKit planning skill. Use when starting any multi-step feature, bugfix, or refactor in StoreKit. Runs storekit-scout for codebase recon, writes a bite-sized implementation plan with model-hint labels on every task, then generates a hybrid-execute paste prompt for parallel session dispatch. Trigger on "write a plan", "plan this feature", or when starting any task with >2 files.
---

I'm using the sp-plan skill to write the implementation plan.

## Step 1: Run storekit-scout

Before writing a single task, invoke the storekit-scout agent with the feature description.
Wait for the scout report. The plan's file list and gotchas section come from that report.

If the feature description is vague, ask one clarifying question before invoking the scout:
"What is the entry point for this feature — a new route, a new component, or a schema change?"

## Step 2: Write the plan

Save to: `docs/plans/YYYY-MM-DD-<feature-name>.md`

### Plan document header (required)

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence]

**Architecture:** [2-3 sentences about approach, informed by scout report]

**Tech Stack:** [Key files/libraries this touches]

**Scout report:** [date — confirms recon was run before plan was written]

---
```

### Task structure (required for every task)

```markdown
### Task N: [Component Name]
**model-hint: haiku|sonnet**  ← REQUIRED. Every task gets a label. See generalization-guide.md.

**Files:**
- Create/Modify/Test: `exact/path/to/file.ts`

**Step 1: Write the failing test**
[exact test code]

**Step 2: Run test to verify it fails**
Run: `npm test -- --reporter=verbose tests/path/test.ts`
Expected: FAIL with "[specific error message]"

**Step 3: Write minimal implementation**
[exact implementation code]

**Step 4: Run test to verify it passes**
Run: `npm test -- --reporter=verbose tests/path/test.ts`
Expected: PASS

**Step 5: TypeScript check**
Run: `npx tsc --noEmit`
Expected: no errors

**Step 6: Commit**
```bash
git add [specific files]
git commit -m "feat: [description]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
```

## Model-hint labeling rules

Reference: `~/.claude/plugins/marketplaces/storekit-planner/docs/generalization-guide.md`

Quick reference (use the full guide for edge cases):
- File search, glob, count → `haiku`
- Single-file edit with clear spec → `haiku`
- Test file generation (add prompt: "use static top-level imports") → `haiku`
- Cross-file trace / reasoning → `haiku`
- Architectural trade-off Q&A → `haiku`
- Writing a plan document (this skill itself) → `sonnet`
- Open-ended design with no reference structure → `sonnet`
- Synthesis across >5 files with no reference → `sonnet`

## Step 3: Generate hybrid-execute prompt

After saving the plan, do NOT present two options. Always generate the paste prompt.

**REQUIRED SUB-SKILL:** Use `hybrid-execute` skill at this point.

Announce: "Plan complete. Generating parallel session prompt now."

Then invoke hybrid-execute with the plan file path.
```

**Step 2: Verify**

```bash
ls ~/.claude/plugins/marketplaces/storekit-planner/skills/sp-plan/
```
Expected: `SKILL.md`

---

## Task 4: hybrid-execute skill
**model-hint: sonnet**

Replaces the two-option handoff. Given a plan file path, generates a standardised, ready-to-paste prompt for a parallel session. The user copies it, opens a new session in the worktree, pastes. No choices required.

**Files:**
- Create: `~/.claude/plugins/marketplaces/storekit-planner/skills/hybrid-execute/SKILL.md`

**Step 1: Write the file**

```markdown
---
name: hybrid-execute
description: Generates a ready-to-paste parallel session prompt from a completed plan file. Use after sp-plan finishes writing a plan. Do NOT present a two-option choice — always generate the prompt automatically. Trigger when a plan has been written and is ready to execute.
---

I'm using the hybrid-execute skill to generate the parallel session prompt.

## Input

The plan file path. If not provided, look for the most recently modified file in
`docs/plans/` and confirm with the user before proceeding.

## What to generate

Read the plan file. Extract:
1. The plan file path (absolute)
2. The working directory (`/root/tal-boilerplate`)
3. Whether a dev server is needed (scan tasks for `npm run dev` calls)
4. The batch strategy (default: all tasks if ≤5 tasks, else first 3)

Then output the following in a fenced code block so the user can copy it cleanly:

---

```
I'm using the executing-plans skill to implement this plan.

Execute the implementation plan at `[PLAN_FILE_PATH]`.

Context:
- Working dir: /root/tal-boilerplate
- TypeScript check: npx tsc --noEmit (must pass before each commit)
- Test runner: npm test
- Lint: npm run lint (fix errors, review warnings)
- Dev server: [NOT NEEDED | Start with: npm run dev (port 3001)]

Batch: [All N tasks in one batch | First 3 tasks — report back after Task 3]

On completion, return a structured report:
- Task status (completed/blocked/skipped) for each task
- Final tsc + test output
- Any deviations from the plan and why
- Ready-to-continue confirmation
```

---

After outputting the prompt, say:

> Paste this into a new Claude Code session opened in the project worktree.
> When the session returns its completion report, bring it back here for review.

## Rules

1. Always output the prompt in a code block (triple backtick, no language tag).
2. Never present "Option 1 / Option 2." This skill's output IS the option.
3. If the plan has >5 tasks, set batch to "First 3 tasks" and note this to the user.
4. Do not summarise the plan — the paste prompt should be self-contained.
```

**Step 2: Verify**

```bash
ls ~/.claude/plugins/marketplaces/storekit-planner/skills/hybrid-execute/
```
Expected: `SKILL.md`

---

## Task 5: /sp-plan command
**model-hint: haiku**

Slash command that invokes the sp-plan skill with an optional feature description argument.

**Files:**
- Create: `~/.claude/plugins/marketplaces/storekit-planner/commands/sp-plan.md`

**Step 1: Write the file**

```markdown
---
description: Write a StoreKit implementation plan. Runs storekit-scout for codebase recon, writes a bite-sized plan with model-hint labels on every task, and generates a hybrid-execute paste prompt for parallel session dispatch.
argument-hint: "[feature description]"
---

Use the sp-plan skill to write an implementation plan for: $ARGUMENTS
```

**Step 2: Verify**

```bash
ls ~/.claude/plugins/marketplaces/storekit-planner/commands/
```
Expected: `haiku-benchmark.md  sp-plan.md`

---

## Task 6: Update plugin.json and README
**model-hint: haiku**

Bump version to 2.0.0, update description to reflect Phase 2 complete. Update README.

**Files:**
- Modify: `~/.claude/plugins/marketplaces/storekit-planner/.claude-plugin/plugin.json`
- Modify: `~/.claude/plugins/marketplaces/storekit-planner/README.md`

**Step 1: Read current plugin.json**

Read `~/.claude/plugins/marketplaces/storekit-planner/.claude-plugin/plugin.json`

**Step 2: Write updated plugin.json**

```json
{
  "name": "storekit-planner",
  "description": "StoreKit planning plugin: /sp-plan with Haiku 4.5 scout, empirical model-hint task labeling, hybrid-execute parallel session handoff, and Haiku capability benchmark suite. Generalization guide included for project-agnostic adaptation.",
  "version": "2.0.0",
  "author": {
    "name": "StoreKit",
    "email": ""
  },
  "keywords": ["planning", "haiku", "orchestration", "storekit", "hybrid-execute", "model-hint"]
}
```

**Step 3: Write updated README.md**

```markdown
# storekit-planner

StoreKit Claude Code planning plugin.

## Status: Phase 2 Complete

| Component | Status |
|-----------|--------|
| `skills/haiku-benchmark` | ✅ Phase 1 |
| `skills/sp-plan` | ✅ Phase 2 |
| `skills/hybrid-execute` | ✅ Phase 2 |
| `agents/storekit-scout` | ✅ Phase 2 |
| `commands/haiku-benchmark` | ✅ Phase 1 |
| `commands/sp-plan` | ✅ Phase 2 |
| `docs/generalization-guide.md` | ✅ Phase 2 |

## Commands

- `/haiku-benchmark` — Run 5-tier capability benchmark against StoreKit codebase
- `/sp-plan [feature description]` — Write a plan with scout recon + model-hint labels + paste prompt

## Benchmark results (2026-03-08)

Haiku 4.5 passed all 5 tiers. Original hypothesis (Tiers 4-5 "firmly Sonnet territory")
was wrong. See `docs/generalization-guide.md` for the full evidence-based model-hint guide.

## Adapting to a different project

See `docs/generalization-guide.md` → "Adapting This Plugin to a Different Project"

3 things to change: scout working dir + file patterns, sp-plan output path, plugin.json name.
Everything else — the tier framework, model-hint labels, hybrid-execute pattern — is portable.
```

**Step 4: Verify both files**

```bash
cat ~/.claude/plugins/marketplaces/storekit-planner/.claude-plugin/plugin.json
cat ~/.claude/plugins/marketplaces/storekit-planner/README.md
```

---

## Task 7: Phase 2 smoke test
**model-hint: haiku**

Verify all Phase 2 files are present and the generalization guide is readable.

**Step 1: Run the smoke test**

```bash
echo "=== Phase 2 Smoke Test ===" && \
echo "" && \
echo "--- Skills ---" && \
ls ~/.claude/plugins/marketplaces/storekit-planner/skills/ && \
echo "" && \
echo "--- Agents ---" && \
ls ~/.claude/plugins/marketplaces/storekit-planner/agents/ && \
echo "" && \
echo "--- Commands ---" && \
ls ~/.claude/plugins/marketplaces/storekit-planner/commands/ && \
echo "" && \
echo "--- Docs ---" && \
ls ~/.claude/plugins/marketplaces/storekit-planner/docs/ && \
echo "" && \
echo "--- plugin.json version ---" && \
cat ~/.claude/plugins/marketplaces/storekit-planner/.claude-plugin/plugin.json | grep version && \
echo "" && \
echo "--- File count check ---" && \
echo "SKILL.md files:" && find ~/.claude/plugins/marketplaces/storekit-planner/skills -name "SKILL.md" | wc -l && \
echo "AGENT.md files:" && find ~/.claude/plugins/marketplaces/storekit-planner/agents -name "AGENT.md" | wc -l && \
echo "Command files:" && find ~/.claude/plugins/marketplaces/storekit-planner/commands -name "*.md" | wc -l
```

**Expected output:**
```
=== Phase 2 Smoke Test ===

--- Skills ---
haiku-benchmark  hybrid-execute  sp-plan

--- Agents ---
storekit-scout

--- Commands ---
haiku-benchmark.md  sp-plan.md

--- Docs ---
generalization-guide.md

--- plugin.json version ---
  "version": "2.0.0",

--- File count check ---
SKILL.md files: 3
AGENT.md files: 1
Command files: 2
```

**Step 2: Verify generalization guide has model-hint table**

```bash
grep "model-hint: haiku" ~/.claude/plugins/marketplaces/storekit-planner/docs/generalization-guide.md | head -3
```

Expected: at least 3 lines containing `model-hint: haiku`

**Step 3: Report**

Return a structured report:
```
Phase 2 Smoke Test: [PASS/FAIL]
Skills present: [list]
Agent present: [yes/no]
Commands present: [list]
Generalization guide: [present/missing]
plugin.json version: [version]
Any missing files: [list or "none"]
```

---

## Post-completion

After all 7 tasks pass the smoke test:

1. **No restart needed** — plugin was already registered in Phase 1. New skills/agents/commands are auto-discovered from existing directories.

2. **Verify /sp-plan is accessible:**
   In a new session (same or fresh), type `/sp-plan` — it should appear in command suggestions.

3. **First real run:**
   Use `/sp-plan` for the next StoreKit feature. The scout will run, the plan will be labeled, the paste prompt will be generated. Bring the parallel session report back and review.

4. **Generalization trigger:**
   When you want to adapt this plugin to a new project, open `docs/generalization-guide.md` and follow the "Adapting to a different project" section. Re-run the benchmark on the new codebase before trusting the model-hint labels.

---

