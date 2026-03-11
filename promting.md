# Claude Prompt Engineering Cheatsheet

> Best practices for writing instructions that Claude reliably follows.

---

## 1. Command Strength Hierarchy

Use stronger language for critical instructions:

| Strength | Keywords | When to Use |
|----------|----------|-------------|
| **Absolute** | `NEVER`, `ALWAYS`, `MUST`, `FORBIDDEN`, `CRITICAL` | Non-negotiable rules |
| **Stop** | `STOP`, `WAIT`, `DO NOT proceed`, `HALT` | Gates/checkpoints |
| **Required** | `REQUIRED`, `MANDATORY`, `you MUST` | Essential steps |
| **Should** | `should`, `prefer`, `recommended` | Soft guidance |

### Examples
```markdown
# Weak (might skip)
- Present the plan to the user

# Strong (will follow)
- **STOP. You MUST present the plan to the user before any research.**
- **FORBIDDEN**: Calling research tools before plan approval
```

---

## 2. Gates & Checkpoints

Force stopping points with explicit gates:

```markdown
## CHECKPOINT: Plan Approval

<gate>
**STOP HERE. DO NOT proceed to the next phase.**

Before continuing, verify:
- [ ] Plan presented to user
- [ ] User explicitly approved (said "yes", "go", "proceed")

If user has NOT approved → WAIT
If user approved → Continue to next phase
</gate>
```

### Gate Pattern Template
```markdown
<phase_name_gate>
**HALT. Complete these requirements before proceeding:**

1. [Action to complete]
2. [Output to show user]
3. [Approval to obtain]

**FORBIDDEN until gate passes:** [list of tools/actions]
**ALLOWED:** [list of permitted tools/actions]
</phase_name_gate>
```

---

## 3. Tool Control

### Prohibit Tools
```markdown
**FORBIDDEN tools during planning phase:**
- packageSearch
- githubSearchCode
- githubGetFileContent
- Any tool that executes research

**ALLOWED tools during planning:**
- TodoWrite
- AskUserQuestion
- Text output only
```

### Require Tools
```markdown
**REQUIRED:** You MUST call `AskUserQuestion` to get plan approval.
DO NOT proceed without using this tool.
```

### Tool Sequencing
```markdown
**Tool Order (MUST follow):**
1. FIRST: localSearchCode → get lineHint
2. THEN: lspGotoDefinition(lineHint=N)
3. NEVER: Call LSP tools without lineHint from step 1
```

---

## 4. Output Formatting

### Force Specific Format
```markdown
**OUTPUT FORMAT (REQUIRED):**
You MUST output your plan in EXACTLY this format:

```
## Research Plan
**Goal:** [user's question]

**Steps:**
1. [tool] → [purpose]
2. [tool] → [purpose]
3. [tool] → [purpose]

**Estimated scope:** [files/repos to explore]

Proceed? (yes/no)
```

DO NOT deviate from this format.
```

### Structured Output
```markdown
**Response Structure (MANDATORY):**
1. TL;DR (2-3 sentences)
2. Details (with code references)
3. Diagram (mermaid if applicable)
4. Sources (file:line format)

NEVER skip sections. If a section doesn't apply, write "N/A".
```

---

## 5. Conditional Logic

### If/Then Rules
```markdown
<conditional_rules>
**IF** user asks about external package → **THEN** use packageSearch FIRST
**IF** user asks about local code → **THEN** NEVER use github* tools
**IF** search returns empty → **THEN** try 3 semantic variants before giving up
**IF** stuck for 3+ tool calls → **THEN** STOP and ask user for guidance
</conditional_rules>
```

### Decision Tables
```markdown
| User Intent | Wrong Choice | Right Choice |
|-------------|--------------|--------------|
| "Where is X defined?" | Read random files | Search → LSP goto |
| "Who calls X?" | grep everything | lspCallHierarchy |
| "External package?" | Local search | packageSearch first |
```

---

## 6. Enforcement Patterns

### The Triple Lock (Strongest)
```markdown
1. **STATE THE RULE:** "You must present the plan before executing."
2. **FORBID THE OPPOSITE:** "FORBIDDEN: Calling research tools before approval."
3. **REQUIRE CONFIRMATION:** "You MUST use AskUserQuestion to get approval."
```

### Numbered Steps with Gates
```markdown
## Execution Flow

### Step 1: Initialize
- Run server init
- Load context
→ Gate: Context loaded? If NO, stop and report error.

### Step 2: Plan (STOP POINT)
- Create research plan
- Present to user
→ **GATE: WAIT for user approval. DO NOT proceed.**

### Step 3: Research
- Execute plan
- Follow hints
→ Gate: Goal achieved? If NO, iterate or ask user.

### Step 4: Output
- Present findings
- Ask about documentation
```

---

## 7. Repetition for Emphasis

Repeat critical rules in multiple places:

```markdown
## Overview
**CRITICAL:** Always present plan before executing.

## Planning Phase
**REMINDER:** You MUST present the plan and WAIT for approval.

## Research Phase
**CHECK:** Did user approve the plan? If NOT, go back to Planning Phase.

## Common Mistakes
- ❌ Executing research without showing plan first
- ✅ Present plan → Get approval → Execute
```

---

## 8. Anti-Patterns (What NOT to Do)

### Weak Language
```markdown
# Bad - easily ignored
- Consider showing the plan to the user
- You might want to wait for approval
- It would be nice to present the plan first

# Good - will follow
- **STOP.** Present the plan to the user.
- **WAIT** for explicit approval before proceeding.
- **FORBIDDEN:** Research tools before plan approval.
```

### Ambiguous Instructions
```markdown
# Bad - unclear
- Do some planning first

# Good - specific
- Create a research plan with 3-7 steps
- Each step must include: [tool name] → [specific goal]
- Output plan in markdown format
- Use AskUserQuestion tool to get approval
```

### Missing Enforcement
```markdown
# Bad - no enforcement
- Present the plan to the user

# Good - with enforcement
- Present the plan to the user
- **REQUIRED:** Use AskUserQuestion with the plan
- **FORBIDDEN:** Any research tool calls until user responds
```

---

## 9. Complete Gate Template

Copy-paste this for any checkpoint:

```markdown
## PHASE: [Name]

<[name]_gate>
### Pre-Conditions
- [ ] [Previous phase completed]
- [ ] [Required information available]

### Actions (REQUIRED)
1. [Specific action]
2. [Specific output format]
3. [Specific tool to use]

### Gate Check
**STOP. Verify before proceeding:**
- [ ] [Condition 1 met]
- [ ] [Condition 2 met]
- [ ] User approval obtained (if required)

### FORBIDDEN Until Gate Passes
- [Tool 1]
- [Tool 2]
- [Action 1]

### ALLOWED
- [Tool 1]
- [Tool 2]

### On Failure
- IF [condition] fails → [recovery action]
- IF stuck → Ask user for guidance
</[name]_gate>

→ **PROCEED TO NEXT PHASE ONLY AFTER ALL CHECKBOXES ARE CHECKED**
```

---

## 10. Quick Reference

| Goal | Pattern |
|------|---------|
| Force a stop | `**STOP. WAIT. DO NOT proceed.**` |
| Require a tool | `**REQUIRED:** You MUST use [tool]` |
| Ban a tool | `**FORBIDDEN:** [tool] until [condition]` |
| Force output format | `**OUTPUT FORMAT (REQUIRED):** [template]` |
| Create decision point | `**GATE:** [condition] → WAIT for user` |
| Handle errors | `**IF** [error] → **THEN** [recovery]` |
| Emphasize rule | Repeat in 3+ places with **bold** |

---

## 11. Testing Your Prompts

After writing instructions, verify:

1. **Scan for weak words:** "consider", "might", "could", "should" → strengthen or remove
2. **Check for gates:** Every phase transition has a checkpoint?
3. **Tool control:** Forbidden/allowed lists are explicit?
4. **Format specified:** Output structure is defined?
5. **Failure handling:** What happens if something goes wrong?

---

## Example: Rewritten Plan Phase

**Before (weak):**
```markdown
## 3. PLAN
- Create a research plan
- Tell user what you're going to do
```

**After (strong):**
```markdown
## 3. PLAN

<plan_gate>
**STOP. DO NOT call any research tools.**

### Required Actions
1. Analyze user intent
2. Create research plan (3-7 steps)
3. Output plan in this EXACT format:

```
## Research Plan
**Goal:** [question]
**Steps:**
1. [tool] → [purpose]
2. [tool] → [purpose]
...
**Scope:** [what will be explored]

Ready to proceed?
```

4. **REQUIRED:** Call `AskUserQuestion` tool with options:
   - "Yes, execute the plan"
   - "Modify the plan"
   - "Add focus area"

### FORBIDDEN Until Approved
- packageSearch
- githubSearchCode
- githubGetFileContent
- localSearchCode
- Any research execution

### ALLOWED
- TodoWrite (to draft)
- AskUserQuestion (to confirm)
- Text output (to present)

**WAIT for user response. DO NOT proceed without explicit approval.**
</plan_gate>
```

---

*Created for Claude Code prompt engineering*
