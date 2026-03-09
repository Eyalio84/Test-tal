# cascade-ai Plugin Family Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Execution model:** Open a NEW Claude Code session, select **Haiku 4.5** as the model, paste the hybrid-execute prompt at the bottom of this file. Sonnet (coordinator session) reviews each batch and manages Gemini pause points.

**Goal:** Build `cascade-ai` — three standalone Claude Code plugins (haiku-toolkit, gemini-toolkit, cascade) that together prove the thesis: Haiku 4.5 + Gemini + Sonnet-as-coordinator outperforms Opus-for-everything at a fraction of the cost, and the whole is bigger than the sum of its parts.

**Architecture:** One repo (`/root/cascade-ai/`), three independently installable plugins under `plugins/`, each with its own `plugin.json`. Each plugin is useful alone; installing all three activates the full cascade workflow. The development process itself is a live proof of concept — Haiku 4.5 writes the plugin that formalizes what Haiku 4.5 can do, while Sonnet coordinates.

**Tech Stack:** Claude Code plugin system (SKILL.md, AGENT.md, command .md, plugin.json), Gemini REST API (`$GEMINI_API_KEY`), Python 3 (project context script), Bash (registration helper), Markdown.

**New repo location:** `/root/cascade-ai/`
**Install paths:** plugins register in `~/.claude/plugins/installed_plugins.json` pointing to absolute paths under `/root/cascade-ai/plugins/`

---

## BATCH 1: Foundation + haiku-toolkit (Tasks 1–6)

---

### Task 1: Scaffold the repo directory structure
**model-hint: haiku**

**Files:**
- Create: `/root/cascade-ai/` and all subdirectories
- Create: `/root/cascade-ai/README.md` (stub)
- Create: `/root/cascade-ai/docs/theory.md` (stub)
- Create: `/root/cascade-ai/docs/benchmark-framework.md` (stub)
- Create: `/root/cascade-ai/docs/capability-matrix.json` (stub)

**Step 1: Create directory tree**
```bash
mkdir -p /root/cascade-ai/docs
mkdir -p /root/cascade-ai/plugins/haiku-toolkit/.claude-plugin
mkdir -p /root/cascade-ai/plugins/haiku-toolkit/skills/haiku-benchmark
mkdir -p /root/cascade-ai/plugins/haiku-toolkit/skills/haiku-delegate
mkdir -p /root/cascade-ai/plugins/haiku-toolkit/agents/haiku-scout
mkdir -p /root/cascade-ai/plugins/haiku-toolkit/commands
mkdir -p /root/cascade-ai/plugins/gemini-toolkit/.claude-plugin
mkdir -p /root/cascade-ai/plugins/gemini-toolkit/skills/gemini-research
mkdir -p /root/cascade-ai/plugins/gemini-toolkit/skills/gemini-image-scout
mkdir -p /root/cascade-ai/plugins/gemini-toolkit/skills/gemini-review
mkdir -p /root/cascade-ai/plugins/gemini-toolkit/skills/gemini-bulk-gen
mkdir -p /root/cascade-ai/plugins/gemini-toolkit/agents/gemini-researcher
mkdir -p /root/cascade-ai/plugins/gemini-toolkit/agents/gemini-image-scout
mkdir -p /root/cascade-ai/plugins/gemini-toolkit/commands
mkdir -p /root/cascade-ai/plugins/cascade/.claude-plugin
mkdir -p /root/cascade-ai/plugins/cascade/skills/cascade-plan/scripts
mkdir -p /root/cascade-ai/plugins/cascade/skills/task-router
mkdir -p /root/cascade-ai/plugins/cascade/skills/cascade-execute
mkdir -p /root/cascade-ai/plugins/cascade/agents/cascade-coordinator
mkdir -p /root/cascade-ai/plugins/cascade/commands
```

**Step 2: Initialize git repo**
```bash
cd /root/cascade-ai && git init && git commit --allow-empty -m "chore: init cascade-ai repo"
```

**Step 3: Write README stub**

Write `/root/cascade-ai/README.md`:
```markdown
# cascade-ai

> Three Claude Code plugins. Each useful alone. Together, a game changer.

## Plugins

- **haiku-toolkit** — Empirical Haiku 4.5 benchmark + generalized scout + delegation primitives
- **gemini-toolkit** — Gemini as a precision instrument: web research, image scouting, code review
- **cascade** — Sonnet as coordinator: task routing, model assignment, human-gated execution

## The thesis

_(See `docs/theory.md`)_

## Installation

_(See individual plugin READMEs)_
```

**Step 4: Commit**
```bash
cd /root/cascade-ai && git add -A && git commit -m "chore: scaffold repo structure"
```

---

### Task 2: Write `docs/theory.md` — the published thesis
**model-hint: sonnet**

**Files:**
- Write: `/root/cascade-ai/docs/theory.md`

**Step 1: Write the theory document**

Write `/root/cascade-ai/docs/theory.md` with this exact content:

```markdown
# The cascade-ai Theory

_Why Haiku 4.5 + Gemini + Sonnet-as-coordinator beats Opus-for-everything._

---

## The common assumption

Most Claude Code users default to Sonnet for everything. Many reach for Opus for "important" tasks. The implicit model is: more capable model = better result.

This assumption is expensive, often wrong, and misses a workflow that's both cheaper and more capable.

---

## What we actually know (empirically)

### Haiku 4.5 passed every tier of a real-codebase benchmark

A 5-tier capability benchmark was run against a production Next.js codebase. No scaffolding. Real code. Real questions.

| Tier | Task class | Result |
|------|-----------|--------|
| 1 | File search, glob, grep, count | PASS |
| 2 | Single-file edit (fully specified) | PASS |
| 3 | Multi-file synthesis | PASS |
| 4 | Cross-file reasoning (3+ files) | PASS |
| 5 | Architectural trade-off + recommendation | PASS |

**No confirmed capability ceiling. The original hypothesis ("Tier 5 is firmly Sonnet territory") was wrong.**

Exceeded-expectations behaviours:
- Corrected a flawed premise in a question instead of answering wrong
- Wrote a working code sketch unprompted when asked for a recommendation
- Identified two risk vectors where the rubric expected one
- Inferred design intent from what was *not* in the code (architectural reading from omission)

See `benchmark-framework.md` to run this benchmark on your own codebase.

### Gemini has capabilities no Claude model has

1. **Live web search** — `google_search_grounding` accesses current sources. Claude's training has a cutoff; Gemini's web grounding does not.
2. **Different reasoning distribution** — Trained differently. Where Sonnet has a confident-but-wrong prior, Gemini may surface what Sonnet wouldn't generate.
3. **Image scouting** — Gemini + Pexels API finds semantically relevant images at scale. No Claude model can do this natively.

### Sonnet is an excellent coordinator, not an implementer

Sonnet's strengths: architectural judgment, deep codebase context, multi-file reasoning, filtering noisy research output, writing plans. Its weakness: it's expensive to use for Tier 1-4 work that Haiku handles equally well.

---

## The cascade pattern

```
Task arrives
  → Classify (what tier is this?)
    → Tier 1-4: Haiku (proven, ~90% of coding tasks)
    → Tier 5 / open-ended design: Sonnet
    → Needs current web knowledge: Gemini (specialist — called by Sonnet)
    → Needs images: Gemini + Pexels (specialist)
  → Execute at assigned tier
  → Human approval gate at decision points
  → Sonnet integrates, coordinates, filters
```

This is not a fallback chain. Haiku is the **default**, not the fallback. The cascade starts at the cheapest model that can do the job and escalates only when it genuinely can't.

---

## The compound intelligence workflow

For plans that touch external standards (ARIA, payments, security, UI patterns):

```
Sonnet designs targeted research query
    ↓
Gemini searches the web, returns sourced report
    ↓
Sonnet filters for 80%+ confidence + direct applicability
    ↓
Human approves specific findings
    ↓
Haiku implements, Sonnet reviews
```

This is not "ask Gemini for help." Sonnet designs the query. Sonnet filters the output. Nothing from Gemini lands in code without both filters.

The 80% threshold:
- Source quality: multiple independent sources agree (not one blog post)
- Applicability: directly maps to current architecture
- Scope: implementable without restructuring existing code
- Recency: 2025-2026 sources

---

## Why this is a game changer

The compound effect across a full feature:

| Without cascade-ai | With cascade-ai |
|-------------------|----------------|
| Sonnet for every task | Haiku for 90% of tasks |
| No external knowledge | Gemini research at pause points |
| Manual model selection | Evidence-based routing |
| Planning from memory | Scout + benchmark before every plan |

Result: plans written with better information, executed by the right model, augmented by current external knowledge at moments that matter. Each plan more complete, faster, cheaper than the last.

---

## The standalone value

Each plugin works independently:

**Install only haiku-toolkit:** Get empirical capability benchmarking for your codebase + smart scout + delegation primitives. Use Haiku confidently for what it can handle.

**Install only gemini-toolkit:** Get Gemini web research, image scouting, and code review from a different reasoning distribution — all callable from Claude Code.

**Install only cascade:** Get Sonnet-as-coordinator with structured task routing and human gates — works with any Claude session.

**Install all three:** The cascade activates. Tasks route automatically. Models hand off to each other. The whole is bigger than the sum of its parts.
```

**Step 2: Commit**
```bash
cd /root/cascade-ai && git add docs/theory.md && git commit -m "docs: write cascade-ai theory — the published thesis"
```

---

### Task 3: Write `docs/benchmark-framework.md` + `docs/capability-matrix.json`
**model-hint: haiku**

**Files:**
- Write: `/root/cascade-ai/docs/benchmark-framework.md`
- Write: `/root/cascade-ai/docs/capability-matrix.json`

**Step 1: Write benchmark-framework.md**

Write `/root/cascade-ai/docs/benchmark-framework.md`:
```markdown
# Haiku 4.5 Capability Benchmark Framework

_Run this on your codebase before trusting the model-hint guide. Results may differ from the StoreKit benchmark depending on your project's architecture._

---

## Setup

Pick one real file from each of these categories in your project:
- A file with 10+ functions/exports (for Tier 1)
- A file you'd ask an engineer to edit (for Tier 2)
- Two related files (for Tier 3)
- Three files with a shared dependency (for Tier 4)
- A design question you've faced recently (for Tier 5)

Run with Haiku 4.5 selected as your model. Give no scaffolding beyond the task description.

---

## The 5 Tiers

### Tier 1 — File operations & search
**Task:** "How many API routes does this project have? List the file paths, line numbers for each route handler, and count any test files."

**Pass criteria:** Correct count, correct paths, exact line numbers, no hallucinated files.

### Tier 2 — Single-file edit (fully specified)
**Task:** "In [file], add a new [type/enum value/field] called [name] following the existing pattern. Run tsc --noEmit to verify."

**Pass criteria:** Correct placement, correct syntax, tsc passes. No unasked changes.

### Tier 3 — Multi-file synthesis
**Task:** "Read [file A] and [file B]. Write a test file for [specific function in A] that follows the style of [file B]."

**Pass criteria:** Test logic correct. Style matches reference. No dynamic imports where static expected (add this constraint explicitly if style matters).

### Tier 4 — Cross-file reasoning
**Task:** "Trace the execution path of [operation] from [entry point] through [file A] → [file B] → [file C]. Cite exact line numbers at each handoff. Then: if [schema/type] changes, which endpoint breaks first and with what error?"

**Pass criteria:** Exact line citations. Correct failure mode. Bonus: corrects a premise if the question contains one.

### Tier 5 — Architectural decision
**Task:** "I need to [add capability X]. I'm considering [option A] vs [option B]. Recommend one with reasoning, then sketch the implementation."

**Pass criteria:** Recommendation with coherent reasoning. Sketch that's actually implementable. Bonus: catches compatibility issues unprompted.

---

## Scoring & routing rules

| Result | Routing rule |
|--------|-------------|
| All 5 pass | Delegate Tier 1-4 freely to Haiku. Keep Tier 5 on Sonnet unless task is Q&A (not implementation). |
| T1-4 pass, T5 fail | Delegate Tier 1-4 only. Tier 5 stays on Sonnet. |
| T1-3 pass, T4 fail | Delegate Tier 1-3. Add cross-file tasks to Sonnet queue. |
| T1-2 pass, T3 fail | Single-file + search only. Watch for style constraints. |

## The n=1 caveat

Run at least 3 times across different file types before trusting results. Single-run variance is real — especially at Tier 3 where Haiku may deviate on code idioms it wasn't explicitly constrained on.

**Mitigation:** For style-sensitive tasks, always add explicit constraint: _"Use [idiom] — do not use [alternative]."_
```

**Step 2: Write capability-matrix.json**

Write `/root/cascade-ai/docs/capability-matrix.json`:
```json
{
  "_comment": "Evidence-based model routing rules. Update after running haiku-benchmark on your codebase.",
  "_version": "1.0.0",
  "_last_updated": "2026-03-09",
  "routing": {
    "haiku": {
      "description": "Claude Haiku 4.5 — default for Tier 1-4 tasks (~90% of coding work)",
      "task_classes": [
        "file_search_glob_grep",
        "file_read_summarize_exports",
        "single_file_edit_specified",
        "test_file_generation",
        "cross_file_execution_trace",
        "cross_file_error_analysis",
        "schema_change_impact_analysis",
        "architectural_tradeoff_qa",
        "data_model_design",
        "boilerplate_generation",
        "config_file_creation",
        "documentation_for_existing_code"
      ],
      "constraints": {
        "style_sensitive_tasks": "Add explicit idiom constraint in prompt. Do not assume Haiku infers stylistic conventions from context alone.",
        "max_file_synthesis": "Tested up to 3 files. For >5 files with no reference output, use sonnet."
      }
    },
    "sonnet": {
      "description": "Claude Sonnet — coordinator, architect, planner",
      "task_classes": [
        "writing_plan_documents",
        "open_ended_design_no_reference",
        "synthesis_across_5plus_files",
        "designing_agent_instruction_sets",
        "filtering_research_output",
        "multi_file_architectural_changes",
        "debugging_non_obvious_failures",
        "final_review_and_integration"
      ]
    },
    "gemini": {
      "description": "Gemini — specialist for live web knowledge and image scouting",
      "task_classes": [
        "web_grounded_research",
        "current_standards_lookup",
        "accessibility_standards_aria_wcag",
        "security_pattern_research",
        "performance_caching_cdn_research",
        "image_scouting_semantic_search",
        "bulk_content_generation",
        "code_review_second_opinion"
      ],
      "models": {
        "gemini-2.5-flash": "Research queries, code review, standard tasks",
        "gemini-2.5-flash-lite": "Bulk content generation, image description",
        "gemini-2.5-pro": "Complex research requiring deep reasoning"
      },
      "trigger_conditions": [
        "Plan touches ARIA / WCAG / accessibility standards",
        "Plan touches external APIs or payment standards",
        "Plan touches component libraries or UI patterns",
        "Plan touches security patterns",
        "Plan touches performance / caching / CDN",
        "Need images for theme or content"
      ]
    }
  },
  "cascade_rules": {
    "default_model": "haiku",
    "escalation_trigger": "Task class not in haiku.task_classes OR task explicitly marked model-hint: sonnet",
    "gemini_trigger": "Any item in gemini.trigger_conditions applies to the current plan",
    "human_gate": "Required before any Gemini research finding lands in code",
    "confidence_threshold": 0.80
  }
}
```

**Step 3: Commit**
```bash
cd /root/cascade-ai && git add docs/ && git commit -m "docs: benchmark framework + capability matrix"
```

---

### Task 4: Write `haiku-toolkit` plugin manifest + README
**model-hint: haiku**

**Files:**
- Write: `/root/cascade-ai/plugins/haiku-toolkit/.claude-plugin/plugin.json`
- Write: `/root/cascade-ai/plugins/haiku-toolkit/README.md`

**Step 1: Write plugin.json**

Write `/root/cascade-ai/plugins/haiku-toolkit/.claude-plugin/plugin.json`:
```json
{
  "name": "haiku-toolkit",
  "description": "Empirical Haiku 4.5 capability benchmark for any codebase, generalized project scout, and evidence-based delegation primitives. Run the benchmark once, get routing rules forever. Part of the cascade-ai plugin family.",
  "version": "1.0.0",
  "author": {
    "name": "cascade-ai",
    "email": ""
  },
  "keywords": ["haiku", "benchmark", "scout", "delegation", "model-hint", "cascade-ai"]
}
```

**Step 2: Write README.md**

Write `/root/cascade-ai/plugins/haiku-toolkit/README.md`:
```markdown
# haiku-toolkit

> Empirical capability benchmarking for Haiku 4.5. Know exactly what it can do on *your* codebase.

## Why

Haiku 4.5 passes a 5-tier capability benchmark on real codebases — including Tier 5 architectural decisions. Most people don't know this. They use Sonnet for everything and pay 3x more than they need to.

This plugin gives you:
1. **`/haiku-benchmark`** — Run the 5-tier benchmark on your codebase. Get empirical routing rules, not assumptions.
2. **`haiku-scout`** agent — Codebase recon before any plan. Maps affected files, existing patterns, gotchas.
3. **`haiku-delegate`** skill — Delegation primitives: how to write prompts that Haiku executes reliably.

## Installation

Add to `~/.claude/plugins/installed_plugins.json`:
```json
"haiku-toolkit@local": [{
  "scope": "user",
  "installPath": "/root/cascade-ai/plugins/haiku-toolkit",
  "version": "1.0.0",
  "installedAt": "2026-03-09T00:00:00.000Z",
  "lastUpdated": "2026-03-09T00:00:00.000Z"
}]
```
Restart Claude Code.

## Standalone value

Works without gemini-toolkit or cascade installed. Run the benchmark, use the routing rules in any Claude Code session manually.

## Part of cascade-ai

When installed with `gemini-toolkit` and `cascade`, haiku-scout is called automatically by cascade-plan before every plan is written.
```

**Step 3: Commit**
```bash
cd /root/cascade-ai && git add plugins/haiku-toolkit/ && git commit -m "feat(haiku-toolkit): plugin manifest + README"
```

---

### Task 5: Write `haiku-benchmark` skill — generalized from storekit-planner
**model-hint: haiku**

**Reference:** `~/.claude/plugins/marketplaces/storekit-planner/skills/haiku-benchmark/SKILL.md` — read it, then generalize (remove StoreKit-specific references, use `$PROJECT_CONTEXT` injection, use task descriptions from `docs/benchmark-framework.md`).

**Files:**
- Write: `/root/cascade-ai/plugins/haiku-toolkit/skills/haiku-benchmark/SKILL.md`
- Write: `/root/cascade-ai/plugins/haiku-toolkit/commands/haiku-benchmark.md`

**Step 1: Write SKILL.md**

Write `/root/cascade-ai/plugins/haiku-toolkit/skills/haiku-benchmark/SKILL.md`:
```markdown
---
name: haiku-benchmark
description: Run a 5-tier empirical capability benchmark for Haiku 4.5 on the current codebase. Produces routing rules you can trust. Use before writing any model-hint labels for a new project. Run with /haiku-benchmark.
allowed-tools: Read, Glob, Grep, Bash, Write, Agent
---

# haiku-benchmark — Empirical Capability Benchmark

Run this skill to discover what Haiku 4.5 can reliably do on **this specific codebase**. Results become your model-hint routing table for all future plans.

## Before you start

You need 5 things from this codebase. Find them now:
1. A file with 10+ exports/functions (for T1)
2. A file you'd ask an engineer to edit (for T2)
3. Two related files (for T3)
4. Three files sharing a dependency (for T4)
5. A real architectural question the codebase raises (for T5)

Use Glob and Grep to find candidates. Pick the most representative ones.

## Run the benchmark

Open a **new Claude Code session** and select **Haiku 4.5** as the model.

Run each tier as a separate message. Copy the task description exactly. Add no explanation or scaffolding — just the task.

---

### Tier 1 — File operations & search

Task to run in Haiku session:
> "How many API routes does this project have? List the file paths, line numbers for each route handler, and count any test files."

Pass criteria: Correct count, correct paths, exact line numbers, no hallucinated files.

---

### Tier 2 — Single-file edit

Task to run in Haiku session (adapt to your codebase):
> "In [file], add a new [type/enum value] called [name] following the existing pattern. Run tsc --noEmit (or equivalent) to verify."

Pass criteria: Correct placement, correct syntax, build passes, no unasked changes.

---

### Tier 3 — Multi-file synthesis

Task to run in Haiku session:
> "Read [file A] and [file B]. Write a test file for [specific function in A] that follows the style of [file B]. Use static top-level imports, not dynamic imports inside test cases."

Pass criteria: Test logic correct. Style matches reference. Note any idiom deviations.

---

### Tier 4 — Cross-file reasoning

Task to run in Haiku session:
> "Trace the execution path of [operation] from [entry point] through [file A] → [file B] → [file C]. Cite exact line numbers at each handoff. If [schema/type] changes, which function breaks first and with what error?"

Pass criteria: Exact line citations. Correct failure mode.

---

### Tier 5 — Architectural decision

Task to run in Haiku session:
> "I need to [add capability]. I'm considering [option A] vs [option B]. Recommend one with reasoning, then sketch the implementation."

Pass criteria: Coherent recommendation with reasoning. Implementable sketch.

---

## Score and write results

After all 5 tiers, write results to `.cascade/haiku-benchmark-[timestamp].md`:

```bash
mkdir -p .cascade && date +%Y%m%dT%H%M
```

Use this template:
```markdown
# Haiku 4.5 Benchmark — [project name]
_Run: [timestamp]_

## Results

| Tier | Task | Result | Notes |
|------|------|--------|-------|
| 1 | File ops + search | PASS/FAIL | |
| 2 | Single-file edit | PASS/FAIL | |
| 3 | Multi-file synthesis | PASS/FAIL | |
| 4 | Cross-file reasoning | PASS/FAIL | |
| 5 | Architectural decision | PASS/FAIL | |

## Routing rules derived

**model-hint: haiku** — delegate confidently:
- [list task classes that passed]

**model-hint: sonnet** — keep here:
- [list task classes that failed or were not tested]

## Style constraints observed
- [any idiom deviations to add as explicit constraints]

## Recommendation
[Overall routing recommendation for this codebase]
```

Tell the user: "Benchmark complete. Results saved to `.cascade/haiku-benchmark-[timestamp].md`. Use these routing rules as model-hint labels in your plans."
```

**Step 2: Write command**

Write `/root/cascade-ai/plugins/haiku-toolkit/commands/haiku-benchmark.md`:
```markdown
---
description: Run the 5-tier Haiku 4.5 capability benchmark on this codebase. Produces evidence-based model-hint routing rules.
---

Run the `haiku-benchmark` skill to empirically verify what Haiku 4.5 can do on this specific codebase.
```

**Step 3: Commit**
```bash
cd /root/cascade-ai && git add plugins/haiku-toolkit/skills/haiku-benchmark/ plugins/haiku-toolkit/commands/ && git commit -m "feat(haiku-toolkit): haiku-benchmark skill + command"
```

---

### Task 6: Write `haiku-scout` agent — generalized from storekit-scout
**model-hint: haiku**

**Reference:** Read `~/.claude/plugins/marketplaces/storekit-planner/agents/storekit-scout/AGENT.md` — then generalize: remove all StoreKit-specific paths, make it project-agnostic by accepting working directory and project description as inputs.

**Files:**
- Write: `/root/cascade-ai/plugins/haiku-toolkit/agents/haiku-scout/AGENT.md`
- Write: `/root/cascade-ai/plugins/haiku-toolkit/commands/haiku-scout.md`

**Step 1: Write AGENT.md**

Write `/root/cascade-ai/plugins/haiku-toolkit/agents/haiku-scout/AGENT.md`:
```markdown
---
name: haiku-scout
description: Codebase reconnaissance agent. Run before writing any plan. Scans affected files, maps existing patterns, surfaces gotchas, and returns a structured report with a question skeleton. Uses Haiku 4.5 for fast batch reads.
tools: Read, Glob, Grep, Bash
model: haiku
color: blue
---

# haiku-scout

You are a codebase reconnaissance agent. Your job is to gather the information a plan-writer needs before writing a single task. You do not write plans. You do not make recommendations. You map the terrain.

## Inputs

You will receive:
1. **Feature description** — what is being built or changed
2. **Working directory** — the project root (use this for all file operations)
3. **Project context** — tech stack, key conventions (from CLAUDE.md if present)

## What to scan

Run these in parallel using batch tool calls:

1. **Find related files** — Glob and Grep for files matching the feature domain. Look for:
   - Existing implementations of similar patterns
   - Files the feature will need to modify
   - Files the feature will need to read/import from
   - Test files for any of the above

2. **Map existing patterns** — Read the related files. Note:
   - Naming conventions (file names, function names, variable names)
   - Import patterns (how modules import each other)
   - Error handling patterns
   - Type patterns (if TypeScript)

3. **Surface gotchas** — Look for:
   - Environment variable dependencies (`process.env`, `env.ts`, `.env.local`)
   - Build-time vs runtime distinctions
   - Any comments marked `// GOTCHA`, `// WARNING`, `// NOTE`
   - Patterns that look inconsistent (deviation from the norm)

4. **Check CLAUDE.md** — If present, read it. Extract:
   - Known gotchas relevant to the feature
   - Conventions the plan must follow
   - Pre-commit requirements

## Output format

Return a structured report with exactly these sections:

```
## Scout Report

**Scope:** [feature addition / refactor / greenfield / port]

**Architectural read:** [2-3 sentences on how this feature fits the existing architecture]

**Related files:**
- [path]: [what it does, why it's relevant]

**Existing patterns to follow:**
- [pattern name]: [example from actual code]

**Gotchas:**
- [specific risk with file reference]

**CLAUDE.md requirements:** [relevant conventions, or "none found"]

**Suggested model-hints:**
- Tasks involving [X] → haiku (Tier [N])
- Tasks involving [Y] → sonnet (open-ended)

**Question skeleton:**
1. [Question grounded in a specific finding]
2. [Question about a gap or ambiguity in the feature description]
3. [Question about an enhancement surfaced by recon]
```

Be specific. Name files. Cite line numbers. Do not generalize.
```

**Step 2: Write command**

Write `/root/cascade-ai/plugins/haiku-toolkit/commands/haiku-scout.md`:
```markdown
---
description: Run codebase recon before writing a plan. Pass a feature description and get a structured report of affected files, existing patterns, gotchas, and a question skeleton.
argument-hint: "[describe the feature you're planning]"
---

Run the `haiku-scout` agent on: $ARGUMENTS
```

**Step 3: Commit**
```bash
cd /root/cascade-ai && git add plugins/haiku-toolkit/agents/ plugins/haiku-toolkit/commands/haiku-scout.md && git commit -m "feat(haiku-toolkit): haiku-scout agent + command"
```

---

## ⏸ GEMINI PAUSE POINT 1 — After Task 6, before gemini-toolkit

**Trigger:** Task 6 commit passes.

**Stop. Do not start Task 7.**

Run this query against Gemini with web search grounding:

> "What are the current best practices for Claude Code plugin development as of 2025-2026? Specifically: (1) recommended frontmatter fields for SKILL.md and AGENT.md beyond name/description/tools/model, (2) any community-established patterns for plugin families or cross-plugin skill invocation, (3) are there documented patterns for skills that invoke other plugins' agents, (4) what is the recommended way to handle missing API keys gracefully in Claude Code skills?"

**Report format to Sonnet (coordinator session):**
- For each finding: confidence level, what it changes in the plan, specific file affected
- Flag anything that contradicts the current plan structure

**Human approval gate:** Present findings to user. Wait for YES/NO before continuing to Task 7.

---

## BATCH 2: haiku-delegate + gemini-toolkit (Tasks 7–12)

---

### Task 7: Write `haiku-delegate` skill — delegation primitives
**model-hint: sonnet**

This is open-ended design work. Sonnet writes this — it requires synthesizing the benchmark findings, the capability matrix, and the scout pattern into a reusable delegation guide.

**Files:**
- Write: `/root/cascade-ai/plugins/haiku-toolkit/skills/haiku-delegate/SKILL.md`

**Step 1: Write SKILL.md**

Write `/root/cascade-ai/plugins/haiku-toolkit/skills/haiku-delegate/SKILL.md`:
```markdown
---
name: haiku-delegate
description: Delegation primitives for Haiku 4.5. Use when you have a task you want to delegate to Haiku but aren't sure how to prompt it reliably. Guides you through classifying the task, writing a tight prompt, and verifying the output.
allowed-tools: Read, Write, Bash, Glob, Grep
---

# haiku-delegate — How to Delegate to Haiku Reliably

## Step 1: Classify the task

Check `docs/capability-matrix.json` (or your project's `.cascade/haiku-benchmark-*.md` if available).

Does your task appear in `haiku.task_classes`? If yes, delegate. If no, keep on Sonnet.

**Edge cases:**
- "Multi-file synthesis" → haiku if you have a reference output to match. Sonnet if open-ended.
- "Test generation" → haiku if you add: "Use static top-level imports, not dynamic imports inside test cases."
- "New module from scratch" → run a T3 benchmark on your codebase first. Unknown ceiling.

## Step 2: Write the prompt

Haiku is reliable when the prompt is:

**Specific:** "In `lib/auth.ts`, add a `refreshToken` field to the `Session` type following the pattern of the existing `accessToken` field." NOT: "Add refresh token support."

**Constrained:** Explicitly state any idioms that must be followed. Do not rely on Haiku inferring style from context.

**Verifiable:** Include a verification step. "Run `npx tsc --noEmit` after making the change. If it fails, fix the error before reporting done."

**Bounded:** One task per delegation. Do not ask Haiku to "add feature X and update all tests and update the README." Three separate delegations.

## Step 3: The delegation prompt template

```
Task: [specific, one-sentence description]

Files to read: [list files Haiku needs for context]
File to modify: [exact path]

What to do:
[step 1]
[step 2]
[step 3]

Constraints:
- [idiom constraint if needed]
- [do NOT touch: any files Haiku must not change]

Verification:
- Run: [command]
- Expected: [specific output]

When done, report: [what you changed and line numbers]
```

## Step 4: Verify output

After Haiku completes, verify:
1. Did it touch only the files it was supposed to?
2. Does the verification command pass?
3. Does the output match the style of surrounding code?

If style deviated: add an explicit constraint to the prompt for next time. This is the n=1 caveat — style variance is real and mitigable with explicit constraints.

## When NOT to use Haiku

- The task requires judgment about which approach is better (use Sonnet)
- The task output will be used as another agent's instruction set (use Sonnet — meta-reasoning risk)
- The task requires synthesizing >5 files with no reference structure (not benchmarked)
- You're writing a plan document (Sonnet only — requires implicit convention judgment)
```

**Step 2: Commit**
```bash
cd /root/cascade-ai && git add plugins/haiku-toolkit/skills/haiku-delegate/ && git commit -m "feat(haiku-toolkit): haiku-delegate skill — delegation primitives"
```

---

### Task 8: Write `gemini-toolkit` plugin manifest + README
**model-hint: haiku**

**Files:**
- Write: `/root/cascade-ai/plugins/gemini-toolkit/.claude-plugin/plugin.json`
- Write: `/root/cascade-ai/plugins/gemini-toolkit/README.md`

**Step 1: Write plugin.json**

Write `/root/cascade-ai/plugins/gemini-toolkit/.claude-plugin/plugin.json`:
```json
{
  "name": "gemini-toolkit",
  "description": "Gemini as a precision instrument for Claude Code: web-grounded research with Sonnet-designed queries, semantic image scouting via Pexels, code review from a different reasoning distribution, and bulk content generation. Requires GEMINI_API_KEY env var. Part of the cascade-ai plugin family.",
  "version": "1.0.0",
  "author": {
    "name": "cascade-ai",
    "email": ""
  },
  "keywords": ["gemini", "research", "web-search", "image-scout", "cascade-ai", "multi-model"]
}
```

**Step 2: Write README.md**

Write `/root/cascade-ai/plugins/gemini-toolkit/README.md`:
```markdown
# gemini-toolkit

> Gemini as a precision instrument. Not "ask Gemini for help" — Sonnet designs the query, Sonnet filters the output, you approve before anything lands in code.

## Why

Claude's training has a cutoff. Gemini's `google_search_grounding` does not. For any task that touches evolving external standards (ARIA, WCAG, payment APIs, security patterns, UI conventions), Gemini's web grounding is a capability no Claude model has.

Gemini also has a different reasoning distribution. Where Sonnet has a confident-but-wrong prior, Gemini may surface what Sonnet wouldn't generate.

## Skills

- **`gemini-research`** — Web-grounded research with structured query input and confidence-filtered output
- **`gemini-image-scout`** — Semantic image search via Gemini + Pexels API. Returns URLs ready for R2/CDN upload
- **`gemini-review`** — Code review from Gemini's perspective. Best used after Sonnet review as a second opinion
- **`gemini-bulk-gen`** — Bulk content generation (product descriptions, copy variations, translations)

## Prerequisites

```bash
export GEMINI_API_KEY=your-key-here
```

Get a key at: https://aistudio.google.com/apikey

## Installation

Add to `~/.claude/plugins/installed_plugins.json`:
```json
"gemini-toolkit@local": [{
  "scope": "user",
  "installPath": "/root/cascade-ai/plugins/gemini-toolkit",
  "version": "1.0.0",
  "installedAt": "2026-03-09T00:00:00.000Z",
  "lastUpdated": "2026-03-09T00:00:00.000Z"
}]
```

## The 80% confidence threshold

Not everything Gemini returns is worth acting on. gemini-research filters for:
- Multiple independent sources agree
- Directly applicable to current architecture
- Implementable without restructuring
- 2025-2026 sources

Below 80%: noted as "monitoring." Above 80%: proposed with specific code change required.

## Part of cascade-ai

When installed with `haiku-toolkit` and `cascade`, Gemini pause points trigger automatically at strategic moments in cascade-plan workflows.
```

**Step 3: Commit**
```bash
cd /root/cascade-ai && git add plugins/gemini-toolkit/ && git commit -m "feat(gemini-toolkit): plugin manifest + README"
```

---

### Task 9: Write `gemini-research` skill + `gemini-researcher` agent
**model-hint: sonnet**

This is the core of gemini-toolkit. Open-ended design — the skill needs to encode the compound intelligence workflow, pause point format, and confidence threshold. Sonnet writes this.

**Files:**
- Write: `/root/cascade-ai/plugins/gemini-toolkit/skills/gemini-research/SKILL.md`
- Write: `/root/cascade-ai/plugins/gemini-toolkit/agents/gemini-researcher/AGENT.md`

**Step 1: Write gemini-research SKILL.md**

Write `/root/cascade-ai/plugins/gemini-toolkit/skills/gemini-research/SKILL.md`:
```markdown
---
name: gemini-research
description: Web-grounded research using Gemini. Use when your task touches evolving external standards (ARIA, WCAG, security, payments, UI patterns, API specs) and you need current knowledge Claude's training cutoff can't provide. Sonnet designs the query. Gemini searches. Sonnet filters for 80%+ confidence. Human approves before anything lands in code.
allowed-tools: Read, Write, Bash, Glob, Grep
---

# gemini-research — Compound Intelligence Research Workflow

## When to use this

Before invoking this skill, verify at least one applies:
- [ ] Task touches ARIA / WCAG / accessibility standards
- [ ] Task touches external API specs or payment standards (Stripe, OAuth, etc.)
- [ ] Task touches security patterns (auth, CSRF, rate limiting)
- [ ] Task touches UI component library patterns or conventions
- [ ] Task touches performance / caching / CDN patterns
- [ ] Sonnet has expressed uncertainty about a current standard

If none apply: do not use this skill. Sonnet's training data is sufficient.

## Step 1: Design the research query

Do NOT ask a vague question. A good research query is:

**Bad:** "What are best practices for accessibility?"
**Good:** "What are the WCAG 2.2 requirements that affect button target size for a Tailwind-based component library in Next.js 16 App Router? Which SC number applies, what is the minimum size, and what changed from WCAG 2.1?"

The query must:
- Name the specific technology stack
- Ask for the specific requirement (not "best practices")
- Request the source (SC number, RFC, spec section)
- Specify recency if relevant ("2025-2026 sources preferred")

## Step 2: Call Gemini via REST API

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "[YOUR QUERY HERE]"}]}],
    "tools": [{"google_search": {}}]
  }' | python3 -c "
import json, sys
r = json.load(sys.stdin)
text = r['candidates'][0]['content']['parts'][0]['text']
print(text)
"
```

If `$GEMINI_API_KEY` is not set, stop and tell the user: "GEMINI_API_KEY is required. Get one at https://aistudio.google.com/apikey and set it in your environment."

## Step 3: Filter for 80%+ confidence

For each finding from Gemini, score it:

| Criterion | Check |
|-----------|-------|
| Source quality | Multiple independent sources agree (not one blog post) |
| Applicability | Directly maps to current architecture and stack |
| Scope | Implementable without restructuring existing code |
| Recency | 2025-2026 sources, not pre-2024 |

**Score 4/4:** HIGH confidence. Propose for implementation.
**Score 3/4:** MEDIUM confidence. Propose with caveat.
**Score 2/4 or below:** Flag as "monitoring." Do NOT propose for implementation.

## Step 4: Present findings to human

Present a structured report — never a wall of text:

```
## Gemini Research Findings — [topic]
_Query: [exact query sent]_
_Model: gemini-2.5-flash | Date: [today]_

### HIGH confidence (recommend implementing)

**Finding:** [specific finding]
**Source:** [what Gemini cited]
**Code change required:** [exact change — a diff, not a description]

### MEDIUM confidence (consider implementing)

**Finding:** [specific finding]
**Source:** [citation]
**Uncertainty:** [what makes this less than 4/4]

### Monitoring (do not implement now)

- [finding]: [why below threshold]

---
**Waiting for your approval. Which findings should I implement? (or "none" to skip)**
```

## Step 5: Wait for human approval

Do NOT proceed with any code changes until the human explicitly approves.

If approved: implement only the approved findings. Nothing else from the research.
If declined: note in session context. Do not re-propose.
```

**Step 2: Write gemini-researcher AGENT.md**

Write `/root/cascade-ai/plugins/gemini-toolkit/agents/gemini-researcher/AGENT.md`:
```markdown
---
name: gemini-researcher
description: Calls Gemini with web search grounding for a specific research query. Returns raw Gemini output. Used by cascade-plan for Gemini pause points and by gemini-research skill. Requires GEMINI_API_KEY.
tools: Bash, Write
model: haiku
color: purple
---

# gemini-researcher

You are a Gemini API caller. You take a research query and return Gemini's response with web grounding.

## Inputs

You will receive:
1. **Query** — the exact research query to send (pre-designed by Sonnet — do not modify it)
2. **Model** — gemini-2.5-flash (default) or gemini-2.5-pro (for complex queries)
3. **Output file** — where to write the raw response

## Execution

Check for API key:
```bash
if [ -z "$GEMINI_API_KEY" ]; then
  echo "ERROR: GEMINI_API_KEY not set. Get a key at https://aistudio.google.com/apikey"
  exit 1
fi
```

Call Gemini:
```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/${MODEL:-gemini-2.5-flash}:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"contents\": [{\"parts\": [{\"text\": \"$QUERY\"}]}], \"tools\": [{\"google_search\": {}}]}" \
  | python3 -c "
import json, sys
try:
    r = json.load(sys.stdin)
    text = r['candidates'][0]['content']['parts'][0]['text']
    print(text)
except Exception as e:
    print(f'ERROR parsing response: {e}')
    sys.exit(1)
" > "$OUTPUT_FILE"
```

Return: the path to the output file and a 1-sentence summary of what Gemini returned.
```

**Step 3: Commit**
```bash
cd /root/cascade-ai && git add plugins/gemini-toolkit/skills/gemini-research/ plugins/gemini-toolkit/agents/gemini-researcher/ && git commit -m "feat(gemini-toolkit): gemini-research skill + gemini-researcher agent"
```

---

### Task 10: Write `gemini-image-scout` skill + agent
**model-hint: haiku**

Port from the existing CDN image scouting work done for StoreKit. The pattern is proven — generalize it.

**Reference:** The image scout concept from StoreKit used Gemini 2.5 Flash to generate semantic search queries for Pexels API, then returned image URLs ready for R2/CDN upload.

**Files:**
- Write: `/root/cascade-ai/plugins/gemini-toolkit/skills/gemini-image-scout/SKILL.md`
- Write: `/root/cascade-ai/plugins/gemini-toolkit/agents/gemini-image-scout/AGENT.md`
- Write: `/root/cascade-ai/plugins/gemini-toolkit/commands/gemini-image-scout.md`

**Step 1: Write SKILL.md**

Write `/root/cascade-ai/plugins/gemini-toolkit/skills/gemini-image-scout/SKILL.md`:
```markdown
---
name: gemini-image-scout
description: Find semantically relevant images using Gemini to generate Pexels search queries. Use when you need images for a theme, landing page, product, or content slot. Returns Pexels image URLs ready for download or CDN upload. Requires GEMINI_API_KEY and PEXELS_API_KEY.
allowed-tools: Bash, Write
argument-hint: "[describe what you need images for — theme, product, page section]"
---

# gemini-image-scout

Find the right images by letting Gemini understand the semantic intent, then searching Pexels.

## Step 1: Generate search queries via Gemini

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"contents\": [{\"parts\": [{\"text\": \"Generate 5 specific Pexels image search queries for: $ARGUMENTS. Each query should be 2-4 words, photographic style, varied subjects. Return as JSON array: [\\\"query1\\\", \\\"query2\\\", ...]\"}]}]
  }" | python3 -c "
import json, sys, re
r = json.load(sys.stdin)
text = r['candidates'][0]['content']['parts'][0]['text']
match = re.search(r'\[.*?\]', text, re.DOTALL)
if match:
    queries = json.loads(match.group())
    for q in queries:
        print(q)
"
```

## Step 2: Search Pexels for each query

For each query returned, search Pexels:
```bash
curl -s "https://api.pexels.com/v1/search?query=[QUERY]&per_page=3&orientation=landscape" \
  -H "Authorization: $PEXELS_API_KEY" | python3 -c "
import json, sys
r = json.load(sys.stdin)
for photo in r.get('photos', []):
    print(f\"{photo['id']}: {photo['src']['large2x']} | {photo['photographer']} | {photo['url']}\")
"
```

## Step 3: Present results

Show a table:
```
| # | Query | Image URL | Photographer | Pexels Link |
|---|-------|-----------|-------------|-------------|
| 1 | [q]  | [url]     | [name]      | [link]      |
...
```

Ask: "Which images would you like to use? Provide numbers, or 'all'."

## Step 4: Output selected URLs

Write selected image URLs to `.cascade/image-scout-results-[timestamp].json`:
```json
{
  "request": "[original request]",
  "selected": [
    { "query": "...", "url": "...", "photographer": "...", "pexels_url": "..." }
  ]
}
```

If `$GEMINI_API_KEY` or `$PEXELS_API_KEY` is missing, stop and name which key is missing.
```

**Step 2: Write AGENT.md**

Write `/root/cascade-ai/plugins/gemini-toolkit/agents/gemini-image-scout/AGENT.md`:
```markdown
---
name: gemini-image-scout
description: Finds semantically relevant images using Gemini to generate search queries + Pexels API. Returns image URLs. Requires GEMINI_API_KEY and PEXELS_API_KEY environment variables.
tools: Bash, Write
model: haiku
color: green
---

# gemini-image-scout

You find images. Given a description of what images are needed, you use Gemini to generate targeted Pexels search queries and return the best results.

Follow the gemini-image-scout skill workflow exactly. Check for both API keys before starting.
```

**Step 3: Write command**

Write `/root/cascade-ai/plugins/gemini-toolkit/commands/gemini-image-scout.md`:
```markdown
---
description: Find semantically relevant images using Gemini + Pexels. Returns image URLs ready for download or CDN upload.
argument-hint: "[describe what you need images for]"
---

Run the `gemini-image-scout` skill for: $ARGUMENTS
```

**Step 4: Commit**
```bash
cd /root/cascade-ai && git add plugins/gemini-toolkit/skills/gemini-image-scout/ plugins/gemini-toolkit/agents/gemini-image-scout/ plugins/gemini-toolkit/commands/gemini-image-scout.md && git commit -m "feat(gemini-toolkit): gemini-image-scout skill + agent + command"
```

---

### Task 11: Write `gemini-review` + `gemini-bulk-gen` skills + remaining commands
**model-hint: haiku**

**Files:**
- Write: `/root/cascade-ai/plugins/gemini-toolkit/skills/gemini-review/SKILL.md`
- Write: `/root/cascade-ai/plugins/gemini-toolkit/skills/gemini-bulk-gen/SKILL.md`
- Write: `/root/cascade-ai/plugins/gemini-toolkit/commands/gemini-research.md`
- Write: `/root/cascade-ai/plugins/gemini-toolkit/commands/gemini-review.md`
- Write: `/root/cascade-ai/plugins/gemini-toolkit/commands/gemini-bulk-gen.md`

**Step 1: Write gemini-review SKILL.md**

Write `/root/cascade-ai/plugins/gemini-toolkit/skills/gemini-review/SKILL.md`:
```markdown
---
name: gemini-review
description: Code review from Gemini's perspective. Use as a second opinion after Sonnet review, especially for security-sensitive code, API integrations, or anything where a different reasoning distribution adds value. Requires GEMINI_API_KEY.
allowed-tools: Read, Bash, Glob, Grep
argument-hint: "[file path or description of code to review]"
---

# gemini-review — Second Opinion Code Review

## When to use

- Security-sensitive code (auth, input validation, SQL, API keys)
- External API integrations (payment flows, OAuth, webhooks)
- Any code where "confident but wrong" is a real risk
- After a major feature ships and before a public release

## Step 1: Gather the code

Read the specified file(s). If reviewing a recent change, run:
```bash
git diff HEAD~1 -- [file]
```

## Step 2: Send to Gemini for review

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"contents\": [{\"parts\": [{\"text\": \"Review this code for bugs, security issues, and correctness. Be specific — cite line numbers. Flag anything that could fail silently. Skip style comments unless they affect correctness.\n\n\`\`\`\n$CODE\n\`\`\`\"}]}]
  }" | python3 -c "import json,sys; r=json.load(sys.stdin); print(r['candidates'][0]['content']['parts'][0]['text'])"
```

## Step 3: Filter and present

Present only HIGH and MEDIUM severity findings. Format each as:
- **Line N:** [issue] — [why it matters] — [suggested fix]

Ask: "Would you like me to implement any of these fixes?"

Do not implement without approval.
```

**Step 2: Write gemini-bulk-gen SKILL.md**

Write `/root/cascade-ai/plugins/gemini-toolkit/skills/gemini-bulk-gen/SKILL.md`:
```markdown
---
name: gemini-bulk-gen
description: Bulk content generation using Gemini Flash. Use for product descriptions, copy variations, theme content, email templates, or any task requiring many variations of structured text. Much cheaper than Claude for this use case. Requires GEMINI_API_KEY.
allowed-tools: Bash, Write, Read
argument-hint: "[what to generate — e.g., '8 product descriptions for a jewelry theme']"
---

# gemini-bulk-gen — Bulk Content Generation

## When to use

- 5+ product descriptions
- Multiple copy variations for A/B testing
- Theme-specific content (hero text, taglines, about pages)
- Structured data generation (categories, tags, metadata)

For 1-2 items: use Sonnet directly. The overhead of this skill isn't worth it.

## Step 1: Build generation prompt

Based on `$ARGUMENTS`, construct a structured prompt that specifies:
- What type of content
- How many items
- Format (JSON array preferred for programmatic use)
- Tone and constraints

## Step 2: Call Gemini Flash (cheapest model for generation)

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"contents\": [{\"parts\": [{\"text\": \"$PROMPT\"}]}]}" \
  | python3 -c "import json,sys; r=json.load(sys.stdin); print(r['candidates'][0]['content']['parts'][0]['text'])"
```

## Step 3: Write to output file

Save to `.cascade/bulk-gen-[timestamp].json`. Report the path to the user.
```

**Step 3: Write commands**

Write `/root/cascade-ai/plugins/gemini-toolkit/commands/gemini-research.md`:
```markdown
---
description: Web-grounded research via Gemini with 80% confidence filtering and human approval gate before anything lands in code.
argument-hint: "[specific research question about current standards, APIs, or patterns]"
---

Run the `gemini-research` skill for: $ARGUMENTS
```

Write `/root/cascade-ai/plugins/gemini-toolkit/commands/gemini-review.md`:
```markdown
---
description: Code review from Gemini's perspective — second opinion after Sonnet, especially for security or API integrations.
argument-hint: "[file path or description of what to review]"
---

Run the `gemini-review` skill for: $ARGUMENTS
```

Write `/root/cascade-ai/plugins/gemini-toolkit/commands/gemini-bulk-gen.md`:
```markdown
---
description: Bulk content generation using Gemini Flash — product descriptions, copy variations, structured text at scale.
argument-hint: "[what to generate and how many]"
---

Run the `gemini-bulk-gen` skill for: $ARGUMENTS
```

**Step 4: Commit**
```bash
cd /root/cascade-ai && git add plugins/gemini-toolkit/ && git commit -m "feat(gemini-toolkit): gemini-review, gemini-bulk-gen skills + all commands"
```

---

## ⏸ GEMINI PAUSE POINT 2 — After Task 11, before cascade plugin

**Trigger:** Task 11 commit passes.

**Stop. Do not start Task 12.**

Run this query against Gemini with web search grounding:

> "What is the current recommended way to call the Gemini API from a shell script or Python script as of 2025-2026? Specifically: (1) is `google_search_grounding` still the correct tool name for web search in the REST API, or has it been renamed, (2) what is the current base URL for the Gemini REST API, (3) are there any breaking changes to the generateContent API in the latest versions, (4) what is the correct way to handle grounding metadata in the response?"

**Report format:** For each finding that would change the Bash commands in Tasks 9-11, present the specific curl command change required.

**Human approval gate:** User reviews findings. If Gemini API syntax has changed, update Tasks 9-11 skill files before continuing.

---

## BATCH 3: cascade plugin (Tasks 12–17)

---

### Task 12: Write `cascade` plugin manifest + README
**model-hint: haiku**

**Files:**
- Write: `/root/cascade-ai/plugins/cascade/.claude-plugin/plugin.json`
- Write: `/root/cascade-ai/plugins/cascade/README.md`

**Step 1: Write plugin.json**

Write `/root/cascade-ai/plugins/cascade/.claude-plugin/plugin.json`:
```json
{
  "name": "cascade",
  "description": "Sonnet as coordinator: evidence-based task routing, model assignment, Gemini pause points, and human-gated execution. The orchestration layer for the cascade-ai plugin family. Works standalone; activates full cascade when haiku-toolkit and gemini-toolkit are also installed.",
  "version": "1.0.0",
  "author": {
    "name": "cascade-ai",
    "email": ""
  },
  "keywords": ["cascade", "orchestration", "routing", "sonnet", "coordinator", "model-hint", "cascade-ai"]
}
```

**Step 2: Write README.md**

Write `/root/cascade-ai/plugins/cascade/README.md`:
```markdown
# cascade

> Sonnet as coordinator. Task routing. Model assignment. Human gates.

## What it does

The cascade plugin is the orchestration layer of the cascade-ai family. It:

1. **Routes tasks** to the right model based on `docs/capability-matrix.json` (or your project's benchmark results)
2. **Generates plans** with model-hint labels on every task — no guessing
3. **Manages Gemini pause points** — stops implementation at the right moment, runs research, presents findings, waits for your approval
4. **Coordinates execution** — hands off to Haiku session for implementation, reviews output, integrates approved Gemini findings

## Commands

- **`/cascade [task]`** — The main entry point. Classifies your task, routes to right model, generates or executes plan
- **`/cascade-setup`** — Register all three cascade-ai plugins in `installed_plugins.json` and verify setup

## Skills

- **`cascade-plan`** — Full planning workflow: haiku-scout → interview → plan with model-hints + Gemini pause points → hybrid-execute paste prompt
- **`task-router`** — Classify a task and get model assignment with reasoning
- **`cascade-execute`** — Generate hybrid-execute paste prompt from a plan file

## Standalone value

Works without haiku-toolkit or gemini-toolkit. You can use cascade-plan and task-router with manual model selection. The full cascade workflow activates when all three plugins are installed.

## Installation

Add to `~/.claude/plugins/installed_plugins.json`:
```json
"cascade@local": [{
  "scope": "user",
  "installPath": "/root/cascade-ai/plugins/cascade",
  "version": "1.0.0",
  "installedAt": "2026-03-09T00:00:00.000Z",
  "lastUpdated": "2026-03-09T00:00:00.000Z"
}]
```
```

**Step 3: Commit**
```bash
cd /root/cascade-ai && git add plugins/cascade/ && git commit -m "feat(cascade): plugin manifest + README"
```

---

### Task 13: Write `cascade-plan` skill + `get_project_context.py`
**model-hint: sonnet**

This is the crown jewel. The generalized `sp-plan` — it must synthesize the scout pattern, model-hint framework, Gemini pause points, and hybrid-execute handoff into one cohesive skill. Open-ended design. Sonnet writes this.

**Reference:** `~/.claude/plugins/marketplaces/storekit-planner/skills/sp-plan/SKILL.md` and `~/.claude/skills/c_plan/SKILL.md` — read both before writing.

**Files:**
- Write: `/root/cascade-ai/plugins/cascade/skills/cascade-plan/SKILL.md`
- Write: `/root/cascade-ai/plugins/cascade/skills/cascade-plan/scripts/get_project_context.py`

**Step 1: Read reference skills**
Read `~/.claude/plugins/marketplaces/storekit-planner/skills/sp-plan/SKILL.md`
Read `~/.claude/skills/c_plan/SKILL.md`
Read `~/.claude/skills/c_plan/scripts/get_project_context.py`

**Step 2: Write SKILL.md**

Write `/root/cascade-ai/plugins/cascade/skills/cascade-plan/SKILL.md`:
```markdown
---
name: cascade-plan
description: Full planning workflow with Sonnet-as-coordinator. Runs haiku-scout, conducts a focused interview, writes a plan with model-hint labels on every task, inserts Gemini pause points where appropriate, and generates a hybrid-execute paste prompt for Haiku 4.5 parallel session. Use with /cascade [description]. The generalized, project-agnostic version of sp-plan.
allowed-tools: Read, Grep, Glob, Bash, AskUserQuestion, Write, Agent
argument-hint: "[describe what you want to build or change]"
---

# cascade-plan

**Your request:** $ARGUMENTS

## Auto-injected project context
!`python3 ${CLAUDE_SKILL_DIR}/scripts/get_project_context.py`

---

## Your role

You are a senior architect running a structured planning session with Sonnet-as-coordinator. You delegate to Haiku where the benchmark justifies it. You use Gemini for external research where evolving standards require it. You are the judgment layer — not the implementer.

Work through all four stages in order.

---

## Stage 1 — Codebase Scout

Spawn the `haiku-scout` agent (from haiku-toolkit if installed, otherwise use the built-in task description).

Pass it:
1. The planning request: **$ARGUMENTS**
2. The auto-injected project context above

Wait for the scout report before continuing.

If haiku-toolkit is not installed: manually scan the codebase for related files and produce the same structured report format (affected files, patterns, gotchas, question skeleton).

---

## Stage 2 — Interview

Using the scout's question skeleton as starting point, make one `AskUserQuestion` call:

**Open with:**
> "This looks like a [feature addition / refactor / greenfield] targeting [area of codebase]."
> "[Scout's 2-3 sentence architectural read]"

**Present scout findings specifically:**
- Name actual files found
- State gaps as concrete questions with file context
- Surface enhancements as options

**Ask 3-5 targeted questions** from the skeleton. Each must:
- Reference a specific file or finding
- Explain why the answer shapes the plan
- Offer concrete choices where possible

---

## Stage 3 — Gemini Pause Point Assessment

Before writing the plan, check the Gemini trigger conditions:

```
Does this plan touch:
- [ ] Accessibility (ARIA, WCAG) → add Type 2 pause after interactive components
- [ ] External APIs or standards (payments, OAuth) → add Type 1 pre-research sweep
- [ ] Component libraries or UI patterns → add Type 1 pre-research + Type 3 completion review
- [ ] Security patterns → add Type 2 pause at auth/validation tasks
- [ ] Performance / caching / CDN → add Type 1 pre-research sweep
```

If any box is checked: include Gemini pause points in the plan. If none: skip pause points entirely.

---

## Stage 4 — Write the Plan

Get timestamp:
```bash
date +%Y%m%d_%H%M
```

Write the plan to `.cascade/plans/cascade_plan_[timestamp].md`.

Use this structure:

```markdown
# Plan: [Feature Name]
_Generated: [timestamp] | Scope: [type]_

## Summary
[2-3 sentences: what, why, approach]

## Context
- **Related code:** [specific files from scout]
- **Follows patterns from:** [naming, architecture conventions]
- **Reuses:** [existing utilities or modules]

## Gaps & Enhancements Incorporated
- [confirmed items from interview]

## Out of Scope
- [deferred items with reason]

## Implementation Tasks

### Task N: [Name]
- **What:** [specific enough for Haiku to execute without asking]
- **Files:** [create/modify/test]
- **model-hint:** haiku | sonnet
- **Notes:** [idiom constraints, gotchas, patterns to follow]

[repeat for each task]

## Gemini Pause Points
[Only include if trigger conditions were met in Stage 3]

### Pause Point [N] — [Type 1/2/3]: [Topic]
**Trigger:** [exact event that stops execution]
**Query:** [exact query to send to Gemini — specific, not vague]
**Report format:** [confidence level, proposed code change]
**Approval gate:** Wait for YES/NO before continuing

## Model Hint Summary
- **Haiku tasks:** [count] — [list task names]
- **Sonnet tasks:** [count] — [list task names]
- **Gemini pause points:** [count]

## Token Budget Estimate
- Scout (Haiku): complete
- Interview (Sonnet): complete
- Implementation: [N Haiku tasks, N Sonnet tasks — est. token range]
```

---

## Stage 5 — Hybrid-Execute Handoff

After writing the plan, invoke the `cascade-execute` skill to generate the paste prompt.

Tell the user:
> "Plan written to `.cascade/plans/cascade_plan_[timestamp].md`
>
> **To execute:** Open a NEW Claude Code session, select **Haiku 4.5** as the model, paste the prompt below.
> This session (Sonnet) stays as coordinator — review each batch and manage Gemini pause points."
>
> [paste prompt block from cascade-execute]
```

**Step 3: Write get_project_context.py**

Port from `~/.claude/skills/c_plan/scripts/get_project_context.py` — read it and adapt for cascade-ai (change output format to include cascade-specific fields if needed, keep project-agnostic).

**Step 4: Commit**
```bash
cd /root/cascade-ai && git add plugins/cascade/skills/cascade-plan/ && git commit -m "feat(cascade): cascade-plan skill — generalized sp-plan with Gemini pause points"
```

---

### Task 14: Write `task-router` skill
**model-hint: sonnet**

Design work — the routing logic requires synthesizing the capability matrix and benchmark framework. Sonnet writes this.

**Files:**
- Write: `/root/cascade-ai/plugins/cascade/skills/task-router/SKILL.md`

**Step 1: Write SKILL.md**

Write `/root/cascade-ai/plugins/cascade/skills/task-router/SKILL.md`:
```markdown
---
name: task-router
description: Classify a task and get an evidence-based model assignment with reasoning. Use before delegating any task to verify you're using the right model. Reads capability-matrix.json or project benchmark results.
allowed-tools: Read, Bash, Glob
argument-hint: "[describe the task you want to route]"
---

# task-router — Evidence-Based Model Assignment

**Task to route:** $ARGUMENTS

## Step 1: Load routing rules

Check for project-specific benchmark results first:
```bash
ls .cascade/haiku-benchmark-*.md 2>/dev/null | tail -1
```

If found: read it and use its routing rules (they override the default matrix).
If not found: read `/root/cascade-ai/docs/capability-matrix.json` (or wherever cascade-ai is installed).

## Step 2: Classify the task

Map `$ARGUMENTS` to one of these classes:

**Haiku classes (delegate if benchmark passed):**
- File search / glob / grep / count
- Single-file edit with specified output
- Test file generation (add idiom constraint if style matters)
- Cross-file execution trace
- Architectural Q&A (not implementation)
- Boilerplate / config generation
- Documentation for existing code

**Sonnet classes (keep here):**
- Writing a plan document
- Open-ended design with no reference structure
- Multi-file synthesis across 5+ files
- Debugging non-obvious failures
- Anything where output is another agent's instructions

**Gemini classes (specialist):**
- Current web standards lookup
- Accessibility / ARIA / WCAG
- External API spec research
- Security pattern research
- Image scouting

## Step 3: Output routing decision

```
## Task Router Decision

**Task:** [task description]
**Classification:** [task class]
**Assigned model:** haiku | sonnet | gemini
**Reasoning:** [1-2 sentences citing the classification and benchmark evidence]
**Constraints:** [any prompt constraints needed for reliable execution]
**Confidence:** high | medium | low
```

If confidence is low: explain what additional information would increase it (e.g., "run haiku-benchmark first").
```

**Step 2: Commit**
```bash
cd /root/cascade-ai && git add plugins/cascade/skills/task-router/ && git commit -m "feat(cascade): task-router skill — evidence-based model assignment"
```

---

### Task 15: Write `cascade-execute` skill — generalized hybrid-execute
**model-hint: haiku**

Port from `~/.claude/plugins/marketplaces/storekit-planner/skills/hybrid-execute/SKILL.md`. Generalize: remove StoreKit references, accept any plan file, generate paste prompt for Haiku 4.5 session.

**Files:**
- Write: `/root/cascade-ai/plugins/cascade/skills/cascade-execute/SKILL.md`

**Step 1: Read reference**
Read `~/.claude/plugins/marketplaces/storekit-planner/skills/hybrid-execute/SKILL.md`

**Step 2: Write SKILL.md**

Write `/root/cascade-ai/plugins/cascade/skills/cascade-execute/SKILL.md`:
```markdown
---
name: cascade-execute
description: Generate a Haiku 4.5 parallel session paste prompt from a cascade-plan plan file. Reads the plan, extracts task count and batch strategy, and outputs a ready-to-paste prompt block. Called automatically by cascade-plan; also available standalone.
allowed-tools: Read, Bash
argument-hint: "[path to plan file — defaults to latest in .cascade/plans/]"
---

# cascade-execute — Parallel Session Handoff

## Step 1: Find the plan

If `$ARGUMENTS` is provided: read that file.
If not: find the latest plan:
```bash
ls -t .cascade/plans/cascade_plan_*.md 2>/dev/null | head -1
```

Read the plan file.

## Step 2: Extract metadata

From the plan, extract:
- Total task count
- Number of haiku tasks vs sonnet tasks
- Gemini pause points (how many, after which tasks)
- Whether dev server is needed
- Recommended batch size (default: 3 tasks per batch)

## Step 3: Generate the paste prompt

Output this exact block (fill in from plan metadata):

````
```
CASCADE EXECUTION PROMPT — Paste this into a Haiku 4.5 session

You are executing a cascade-ai plan. Your role: implement tasks exactly as specified.
The Sonnet coordinator session reviews your output between batches.

Plan file: [path]
Total tasks: [N] ([haiku count] haiku, [sonnet count] sonnet)
Your tasks: all haiku-labeled tasks
Sonnet tasks: [list task names] — skip these, coordinator handles them
Gemini pause points: [count] — [after which tasks]

Execution rules:
1. Read the plan file completely before starting
2. Implement tasks in order, batch of 3 at a time
3. After each batch: report what you did + paste verification output
4. At any Gemini pause point: STOP, report "PAUSE POINT [N] REACHED", wait
5. Do not implement sonnet-labeled tasks — report them for coordinator review
6. For each task: implement → verify → commit → report

[If dev server needed: "Start dev server: npm run dev (port 3001) before Task 1"]

Start with Tasks 1-3. Report when done.
```
````

## Step 4: Print the prompt

Print the block and tell the user: "Copy everything inside the code block and paste it into a new Claude Code session with Haiku 4.5 selected."
```

**Step 3: Commit**
```bash
cd /root/cascade-ai && git add plugins/cascade/skills/cascade-execute/ && git commit -m "feat(cascade): cascade-execute skill — Haiku parallel session handoff"
```

---

### Task 16: Write `cascade-coordinator` agent + cascade commands
**model-hint: sonnet**

The coordinator agent is meta-level — it describes Sonnet's own role in the workflow. Sonnet writes this.

**Files:**
- Write: `/root/cascade-ai/plugins/cascade/agents/cascade-coordinator/AGENT.md`
- Write: `/root/cascade-ai/plugins/cascade/commands/cascade.md`
- Write: `/root/cascade-ai/plugins/cascade/commands/cascade-setup.md`

**Step 1: Write AGENT.md**

Write `/root/cascade-ai/plugins/cascade/agents/cascade-coordinator/AGENT.md`:
```markdown
---
name: cascade-coordinator
description: Sonnet-as-coordinator for cascade-ai workflows. Manages batch reviews between Haiku execution sessions, processes Gemini pause point findings, presents confidence-filtered research to the human for approval, and integrates approved findings. Invoked between Haiku batches — not during implementation.
tools: Read, Write, Bash, Glob, Grep
model: sonnet
color: orange
---

# cascade-coordinator

You are the Sonnet coordinator in a cascade-ai workflow. You do not implement. You coordinate.

## Your responsibilities

### Between Haiku batches
1. Read the Haiku session's batch report
2. Verify: did each task modify only the specified files?
3. Verify: did verification commands pass? (check reported output)
4. Flag any deviations from the plan for user review
5. Confirm: "Batch [N] verified. Continue with Tasks [N+1]-[N+3]?"

### At Gemini pause points
1. Confirm the pause point was reached correctly (after specified task)
2. Send the pre-written research query to Gemini (via gemini-researcher agent)
3. Apply the 80% confidence filter:
   - Score each finding: source quality + applicability + scope + recency
   - 4/4: HIGH — propose for implementation with specific code change
   - 3/4: MEDIUM — propose with caveat
   - ≤2/4: MONITORING — do not propose
4. Present filtered findings to human in the structured format
5. Wait for explicit YES/NO approval before resuming

### At sonnet-labeled tasks
1. Implement the task yourself (you are Sonnet)
2. Report completion to the human
3. Signal Haiku session to continue with next task

## What you do NOT do
- Implement haiku-labeled tasks (that's Haiku's job)
- Make code changes from Gemini research without human approval
- Skip the confidence filter because the finding "seems right"
- Continue past a pause point without explicit user approval
```

**Step 2: Write cascade command**

Write `/root/cascade-ai/plugins/cascade/commands/cascade.md`:
```markdown
---
description: Main entry point for cascade-ai. Routes your task to the right model, plans with model-hints, manages Gemini pause points, and coordinates Haiku parallel execution. Works standalone; activates full cascade when haiku-toolkit and gemini-toolkit are installed.
argument-hint: "[describe what you want to build or change]"
---

Run the `cascade-plan` skill for: $ARGUMENTS
```

**Step 3: Write cascade-setup command**

Write `/root/cascade-ai/plugins/cascade/commands/cascade-setup.md`:
```markdown
---
description: Register all three cascade-ai plugins in installed_plugins.json and verify setup. Run this once after cloning cascade-ai.
---

# cascade-setup

Register all three cascade-ai plugins:

```bash
# Read current installed_plugins.json
cat ~/.claude/plugins/installed_plugins.json
```

Add these entries to the `"plugins"` object in `~/.claude/plugins/installed_plugins.json`:

```json
"haiku-toolkit@local": [{
  "scope": "user",
  "installPath": "/root/cascade-ai/plugins/haiku-toolkit",
  "version": "1.0.0",
  "installedAt": "[TODAY_ISO]",
  "lastUpdated": "[TODAY_ISO]"
}],
"gemini-toolkit@local": [{
  "scope": "user",
  "installPath": "/root/cascade-ai/plugins/gemini-toolkit",
  "version": "1.0.0",
  "installedAt": "[TODAY_ISO]",
  "lastUpdated": "[TODAY_ISO]"
}],
"cascade@local": [{
  "scope": "user",
  "installPath": "/root/cascade-ai/plugins/cascade",
  "version": "1.0.0",
  "installedAt": "[TODAY_ISO]",
  "lastUpdated": "[TODAY_ISO]"
}]
```

Replace `[TODAY_ISO]` with today's date in ISO format:
```bash
date -u +"%Y-%m-%dT%H:%M:%S.000Z"
```

After editing, restart Claude Code. Verify by typing `/cascade` — it should appear in autocomplete.
```

**Step 4: Commit**
```bash
cd /root/cascade-ai && git add plugins/cascade/agents/ plugins/cascade/commands/ && git commit -m "feat(cascade): coordinator agent + cascade + cascade-setup commands"
```

---

## ⏸ GEMINI PAUSE POINT 3 — After Task 16, before root README

**Trigger:** Task 16 commit passes.

**Stop. Do not start Task 17.**

Run this query against Gemini with web search grounding:

> "What is the current state of multi-model Claude Code workflows as of 2025-2026? Specifically: (1) has Anthropic published any official guidance on using multiple Claude models in Claude Code — Haiku vs Sonnet selection, (2) are there any community-published Claude Code plugin patterns for model routing or multi-model orchestration, (3) what are the most common Claude Code plugin patterns that have emerged in the community in 2025-2026, (4) is there any competitive tool to cascade-ai that already exists?"

**Report format:** Tell Sonnet coordinator (this session): is there anything that exists that makes cascade-ai redundant? Is there official Anthropic guidance that validates or contradicts the cascade pattern?

**Human approval gate:** User reviews. If something important is missing or needs to be added to the root README, update plan before Task 17.

---

## BATCH 4: Root README + Registration + Smoke Test (Tasks 17–18)

---

### Task 17: Write root `README.md` — the thesis document
**model-hint: sonnet**

The root README is the publishable face of cascade-ai. It must be compelling, honest, and technically precise. It is the thesis. Sonnet writes this.

**Files:**
- Write: `/root/cascade-ai/README.md` (replace stub from Task 1)

**Step 1: Write root README.md**

This document must include:
1. The hook — what cascade-ai does in 2 sentences
2. The thesis — why the cascade pattern works (reference theory.md briefly)
3. The benchmark results — 5/5 tiers, the exceeded-expectations behaviours
4. The three plugins — standalone value + combined effect
5. Installation — /cascade-setup command
6. The development story — "this plugin family was built using the cascade pattern itself"
7. Contributing — how to run the benchmark on a new codebase and submit results

Length: comprehensive but scannable. Use tables for benchmark results. Use code blocks for commands.

**Step 2: Commit**
```bash
cd /root/cascade-ai && git add README.md && git commit -m "docs: root README — the published thesis for cascade-ai"
```

---

### Task 18: Write `installed_plugins_template.json` + smoke test
**model-hint: haiku**

**Files:**
- Write: `/root/cascade-ai/installed_plugins_template.json`

**Step 1: Write template**

Write `/root/cascade-ai/installed_plugins_template.json`:
```json
{
  "_instructions": "Add these entries to ~/.claude/plugins/installed_plugins.json under 'plugins'. Update installPath if your cascade-ai repo is in a different location. Run /cascade-setup for automated registration.",
  "haiku-toolkit@local": [{
    "scope": "user",
    "installPath": "/root/cascade-ai/plugins/haiku-toolkit",
    "version": "1.0.0",
    "installedAt": "REPLACE_WITH_TODAY",
    "lastUpdated": "REPLACE_WITH_TODAY"
  }],
  "gemini-toolkit@local": [{
    "scope": "user",
    "installPath": "/root/cascade-ai/plugins/gemini-toolkit",
    "version": "1.0.0",
    "installedAt": "REPLACE_WITH_TODAY",
    "lastUpdated": "REPLACE_WITH_TODAY"
  }],
  "cascade@local": [{
    "scope": "user",
    "installPath": "/root/cascade-ai/plugins/cascade",
    "version": "1.0.0",
    "installedAt": "REPLACE_WITH_TODAY",
    "lastUpdated": "REPLACE_WITH_TODAY"
  }]
}
```

**Step 2: Smoke test — register and verify**

Register cascade-ai in `~/.claude/plugins/installed_plugins.json`:
```bash
# Read current file, add the three plugin entries, write back
python3 -c "
import json, datetime

with open('/root/.claude/plugins/installed_plugins.json', 'r') as f:
    data = json.load(f)

now = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')

for name, path in [
    ('haiku-toolkit@local', '/root/cascade-ai/plugins/haiku-toolkit'),
    ('gemini-toolkit@local', '/root/cascade-ai/plugins/gemini-toolkit'),
    ('cascade@local', '/root/cascade-ai/plugins/cascade'),
]:
    data['plugins'][name] = [{
        'scope': 'user',
        'installPath': path,
        'version': '1.0.0',
        'installedAt': now,
        'lastUpdated': now
    }]

with open('/root/.claude/plugins/installed_plugins.json', 'w') as f:
    json.dump(data, f, indent=2)

print('Registered: haiku-toolkit@local, gemini-toolkit@local, cascade@local')
"
```

Verify registration:
```bash
python3 -c "
import json
with open('/root/.claude/plugins/installed_plugins.json') as f:
    d = json.load(f)
for k in ['haiku-toolkit@local', 'gemini-toolkit@local', 'cascade@local']:
    print(f'{k}: {d[\"plugins\"].get(k, \"NOT FOUND\")}')
"
```

Expected output: All three plugins show installPath under `/root/cascade-ai/plugins/`.

**Step 3: Verify file structure is complete**
```bash
find /root/cascade-ai -name "*.md" -o -name "*.json" -o -name "*.py" | sort
```

Expected: All files from all 18 tasks present.

**Step 4: Final commit**
```bash
cd /root/cascade-ai && git add -A && git commit -m "feat: cascade-ai v1.0.0 complete — haiku-toolkit + gemini-toolkit + cascade"
```

---

## Token Budget Estimate

- Scout (Haiku): complete
- Interview (Sonnet): complete
- **Haiku tasks:** 1, 3, 4, 5, 6, 8, 10, 11, 12, 15, 18 — 11 tasks
- **Sonnet tasks:** 2, 7, 9, 13, 14, 16, 17 — 7 tasks
- **Gemini pause points:** 3 (after Tasks 6, 11, 16)
- Estimated: moderate Haiku usage, moderate Sonnet usage, 3 Gemini API calls

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## HYBRID-EXECUTE PASTE PROMPT
## Copy everything below into a NEW Claude Code session with Haiku 4.5 selected
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
CASCADE EXECUTION — cascade-ai Plugin Family
Paste into: NEW Claude Code session | Model: Haiku 4.5

You are the Haiku 4.5 implementer in a cascade-ai build session.
The Sonnet coordinator (separate session) reviews between batches and handles Gemini pause points.

Plan file: /root/tal-boilerplate/docs/plans/2026-03-09-cascade-ai-plugin-family.md
New repo: /root/cascade-ai/

YOUR tasks (model-hint: haiku): 1, 3, 4, 5, 6, 8, 10, 11, 12, 15, 18
COORDINATOR tasks (model-hint: sonnet): 2, 7, 9, 13, 14, 16, 17 — SKIP THESE, report when you reach them

GEMINI PAUSE POINTS — STOP and report when you reach:
- After Task 6: "PAUSE POINT 1 REACHED — awaiting Gemini research + coordinator approval"
- After Task 11: "PAUSE POINT 2 REACHED — awaiting Gemini research + coordinator approval"
- After Task 16: "PAUSE POINT 3 REACHED — awaiting Gemini research + coordinator approval"

EXECUTION RULES:
1. Read the full plan file before starting
2. Implement tasks in order, batch of 3 at a time
3. After each batch: list what you did + paste any verification output
4. Each task ends with a git commit — include the exact commit message from the plan
5. Do not skip verification steps
6. If any step fails: stop, report the error, wait for coordinator guidance

Start with: Tasks 1, 3, 4 (Task 2 is sonnet — skip to Task 3 after Task 1).
Report when done with first batch.
```
