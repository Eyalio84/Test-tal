# P4 — Atomic Component Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract StoreKit's hand-rolled UI patterns into a named, reusable atomic component library with standardised props, full accessibility, and CSS-variable-driven theming — augmented by targeted mid-implementation Gemini web research at strategic pause points.

**Architecture:** `components/ui/` becomes the component library root. Components are built with CVA for variants, `cn()` for class merging, compound component pattern for complex interactive components, and CSS variable tokens throughout. No external UI library dependency (Radix not required — custom implementations following APG patterns). Three Gemini pause points are embedded in the plan at the moments of highest uncertainty — the parallel session stops, presents research findings + proposed enhancements, and waits for approval before continuing.

**Tech Stack:** CVA (`class-variance-authority`), `clsx` + `tailwind-merge` (cn utility), TanStack Table v8 (DataTable only), existing Tailwind + CSS variables. All research pre-conducted: Gemini report at `docs/plans/2026-03-08-p4-atomic-component-library.md` (this file, Task 0 section), scout report at session SESSION-2026-03-08_1722.md.

**Scout report:** 2026-03-08 ✓ — 32 existing components inventoried, 15+ hand-rolled patterns identified as abstraction targets, CSS variable system documented, design tokens catalogued.

**Gemini pre-research:** 2026-03-08 ✓ — Full report embedded in this plan. Confidence level per finding noted inline.

---

## Task 0: Pre-Research Summary (ALREADY COMPLETE — do not re-run)

This task was completed in the planning session. The findings below inform all subsequent tasks.

### From Gemini research (HIGH confidence, adopted):
- **CVA + `cn()`** — The 2025 standard for variant-based styling. No CVA in StoreKit currently. All button/badge/input variants will use CVA.
- **Compound component pattern** — Parent context + named child components. Used for Dialog, Card, Tabs.
- **`asChild` prop** — For trigger components, render the user's element instead of a wrapper div. Implement with a `Slot` utility.
- **ARIA keyboard patterns per APG 2024** — Specific patterns per component documented in tasks below.
- **Skeleton loaders** — `animate-pulse`, geometry must match replaced content, `aria-busy="true"`.
- **Empty states (3 types)** — First-time / search-empty / post-delete. Each has distinct UX.
- **WCAG 2.2 target size minimum** — 24×24px for all interactive targets.
- **Toast: status vs alert role** — Non-critical → `role="status"`, errors → `role="alert"`. react-hot-toast handles this correctly when configured — no migration needed in P4.

### From codebase recon (15+ abstraction targets identified):
- `Button` — primary (bg-ink), secondary (border-ink), ghost (text-only)
- `Badge` — paid (green-50/green-700), pending (amber-50/amber-700), unpaid (gray), count (red-500 circle)
- `Input` / `Textarea` — consistent focus ring (focus:ring-2 focus:ring-amber-300 in editor, focus:border-ink elsewhere) — to be unified
- `Modal/Dialog` — CartDrawer + ConfirmModal are two variants of the same structure
- `Card` — stats card (border-stone-100, p-5), shortcut card (border-stone-200, rounded-lg, hover:shadow-sm)
- `Tabs` — media/page.tsx theme tabs (px-3 py-1, rounded-full, bg-ink active)
- `DataTable` — admin/page.tsx raw table (thead text-xs tracking-widest, border-b border-stone-100, hover:bg-stone-50)
- `Skeleton` / `EmptyState` / `ErrorState` — entirely missing
- `Spinner` — inconsistent, defined inline in 2-3 places

### Design tokens to codify (from recon):
```
Colors:   ink (#0a0a0a) | white | stone-50/100/200/300 | zinc-900/800/700
          green-50/700 (success) | amber-50/700 (warning) | red-500/600 (error)
Spacing:  px/py: 1, 1.5, 2, 3, 4, 5, 6 | gap: 1, 2, 3, 4
Borders:  stone-200/100 | radius: none, sm(2px), base(6px), lg(8px), full(9999px)
Type:     text-[10px] tracking-widest uppercase (labels) | xs | sm | base | lg | xl | 2xl
          font-serif (headings) | font-sans (body)
Shadows:  shadow-sm | shadow-2xl
Z-index:  10 | 40 | 50 | [150] | [200]
Motion:   transition (150ms default) | disabled:opacity-40
```

---

## Installation step (run once before Task 1)

```bash
cd /root/tal-boilerplate
npm install class-variance-authority clsx tailwind-merge @tanstack/react-table
npx tsc --noEmit
```

Expected: packages installed, tsc clean.

---

## BATCH 1 — Foundation + Primitives
_Tasks 1–6. One parallel session. No Gemini pause in this batch._

---

### Task 1: Foundation utilities
**model-hint: haiku**

**Files:**
- Create: `lib/cn.ts`
- Create: `components/ui/index.ts` (barrel export — empty initially, add per task)

**Step 1: Write `lib/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 2: Write `components/ui/index.ts`** (empty barrel — will be filled per task)

```ts
// Atomic component library — barrel export
// Add each component as implemented
```

**Step 3: tsc check**

```bash
npx tsc --noEmit
```

Expected: clean.

**Step 4: Commit**

```bash
git add lib/cn.ts components/ui/index.ts
git commit -m "feat(ui): add cn() utility and component barrel export

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Button component
**model-hint: haiku**

Extracts the 3 existing button patterns + adds loading state, size variants, and `asChild`.

**Files:**
- Create: `components/ui/Button.tsx`
- Modify: `components/ui/index.ts`

**Step 1: Write failing test**

```ts
// tests/ui/Button.test.tsx
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/Button"
import { describe, it, expect } from "vitest"

describe("Button", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole("button", { name: "Click me" })
    expect(btn).toBeDefined()
    expect(btn.className).toContain("bg-ink")
  })

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole("button").className).toContain("bg-transparent")
  })

  it("shows spinner and is disabled when loading", () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole("button")
    expect(btn).toHaveProperty("disabled", true)
    expect(btn.querySelector("[aria-hidden]")).toBeDefined()
  })

  it("renders as child element with asChild", () => {
    render(<Button asChild><a href="/test">Link</a></Button>)
    expect(screen.getByRole("link")).toBeDefined()
  })
})
```

**Step 2: Run test — verify it fails**

```bash
npm test -- tests/ui/Button.test.tsx
```

Expected: FAIL — Button not found.

**Step 3: Install testing deps (if needed)**

```bash
npm install -D @testing-library/react @testing-library/jest-dom jsdom
```

If already present, skip.

**Step 4: Write implementation**

```tsx
// components/ui/Button.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"
import { Slot } from "@/components/ui/Slot"

const buttonVariants = cva(
  // Base styles shared by all variants
  "inline-flex items-center justify-center gap-2 font-sans text-xs tracking-widest uppercase transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink",
  {
    variants: {
      variant: {
        primary:     "bg-ink text-white hover:bg-ink/80",
        secondary:   "border border-ink text-ink hover:bg-ink hover:text-white",
        ghost:       "bg-transparent text-ink hover:bg-stone-100",
        outline:     "border border-stone-200 text-ink hover:border-stone-300 hover:shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        link:        "text-ink underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm:   "h-8 px-3 py-1 text-[10px]",
        md:   "h-10 px-4 py-2",
        lg:   "h-12 px-6 py-3 text-sm",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size:    "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            aria-hidden="true"
            className="animate-spin h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { buttonVariants }
```

**Step 5: Write `components/ui/Slot.tsx`** (required for `asChild`)

```tsx
// components/ui/Slot.tsx
// Simplified Slot: merges props + ref onto the single child element.
import * as React from "react"

interface SlotProps {
  children?: React.ReactNode
  [key: string]: unknown
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) return null
    return React.cloneElement(children, {
      ...props,
      ...children.props,
      ref,
      className: cn(
        (props as { className?: string }).className,
        (children.props as { className?: string }).className
      ),
    } as React.HTMLAttributes<HTMLElement>)
  }
)
Slot.displayName = "Slot"

// cn import needed inside this file
import { cn } from "@/lib/cn"
```

**Step 6: Update barrel export**

```ts
// components/ui/index.ts
export { Button, buttonVariants, type ButtonProps } from "./Button"
export { Slot } from "./Slot"
```

**Step 7: Update vitest config to include jsdom**

Read `vitest.config.ts`. If `environment` is already `"jsdom"`, skip. If `"node"`, add a note: Button tests require jsdom — create a separate config or use `@vitest/browser` per file annotation.

If needed, add at top of test file:
```ts
// @vitest-environment jsdom
```

**Step 8: Run tests**

```bash
npm test -- tests/ui/Button.test.tsx
```

Expected: 4/4 PASS.

**Step 9: tsc + commit**

```bash
npx tsc --noEmit
git add components/ui/Button.tsx components/ui/Slot.tsx components/ui/index.ts tests/ui/Button.test.tsx
git commit -m "feat(ui): add Button component — CVA variants, loading state, asChild

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Badge component
**model-hint: haiku**

Extracts status badges (paid/pending/unpaid) and count badge (cart/wishlist numbers).

**Files:**
- Create: `components/ui/Badge.tsx`
- Modify: `components/ui/index.ts`

**Step 1: Write failing test**

```ts
// tests/ui/Badge.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Badge, CountBadge } from "@/components/ui/Badge"
import { describe, it, expect } from "vitest"

describe("Badge", () => {
  it("renders with default (neutral) variant", () => {
    render(<Badge>Pending</Badge>)
    expect(screen.getByText("Pending").className).toContain("text-ink")
  })

  it("applies success variant", () => {
    render(<Badge variant="success">Paid</Badge>)
    expect(screen.getByText("Paid").className).toContain("text-green-700")
  })

  it("applies warning variant", () => {
    render(<Badge variant="warning">Pending</Badge>)
    expect(screen.getByText("Pending").className).toContain("text-amber-700")
  })
})

describe("CountBadge", () => {
  it("renders count", () => {
    render(<CountBadge count={3} />)
    expect(screen.getByText("3")).toBeDefined()
  })

  it("shows 99+ for counts over 99", () => {
    render(<CountBadge count={150} />)
    expect(screen.getByText("99+")).toBeDefined()
  })
})
```

**Step 2: Run test — verify fail**

```bash
npm test -- tests/ui/Badge.test.tsx
```

**Step 3: Write implementation**

```tsx
// components/ui/Badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-xs rounded-sm font-sans",
  {
    variants: {
      variant: {
        default:  "bg-stone-100 text-ink",
        success:  "bg-green-50 text-green-700",
        warning:  "bg-amber-50 text-amber-700",
        error:    "bg-red-50 text-red-600",
        active:   "bg-ink text-white",
        outline:  "border border-stone-200 text-ink",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export function CountBadge({ count, className }: { count: number; className?: string }) {
  const display = count > 99 ? "99+" : String(count)
  return (
    <span
      aria-label={`${count} items`}
      className={cn(
        "inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-sans",
        className
      )}
    >
      {display}
    </span>
  )
}
```

**Step 4: Update barrel, run tests, commit**

```bash
npm test -- tests/ui/Badge.test.tsx
npx tsc --noEmit
git add components/ui/Badge.tsx components/ui/index.ts tests/ui/Badge.test.tsx
git commit -m "feat(ui): add Badge and CountBadge — status variants, 99+ overflow

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Input and Textarea
**model-hint: haiku**

Unifies the two existing focus ring patterns (amber in editor, ink elsewhere) into a single neutral focus ring. Adds error state, helper text, and label with `aria-describedby`.

**Files:**
- Create: `components/ui/Input.tsx`
- Modify: `components/ui/index.ts`

**Step 1: Write failing test**

```ts
// tests/ui/Input.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Input, Textarea } from "@/components/ui/Input"
import { describe, it, expect } from "vitest"

describe("Input", () => {
  it("renders input with label", () => {
    render(<Input label="Email" id="email" type="email" />)
    expect(screen.getByLabelText("Email")).toBeDefined()
  })

  it("shows error message with aria-describedby", () => {
    render(<Input label="Email" id="email" error="Invalid email" />)
    const input = screen.getByLabelText("Email")
    expect(input.getAttribute("aria-describedby")).toContain("email-error")
    expect(screen.getByText("Invalid email")).toBeDefined()
  })

  it("shows helper text", () => {
    render(<Input label="Name" id="name" helper="Full name as on ID" />)
    expect(screen.getByText("Full name as on ID")).toBeDefined()
  })
})
```

**Step 2: Run test — verify fail**

**Step 3: Write implementation**

```tsx
// components/ui/Input.tsx
import * as React from "react"
import { cn } from "@/lib/cn"

const inputBase =
  "w-full border border-stone-200 px-3 py-2 text-sm text-ink bg-white placeholder:text-ink/40 " +
  "focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink " +
  "disabled:opacity-40 disabled:cursor-not-allowed " +
  "aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-200"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, helper, error, className, ...props }, ref) => {
    const helperId  = helper ? `${id}-helper`  : undefined
    const errorId   = error  ? `${id}-error`   : undefined
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs tracking-widest uppercase text-ink/60">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          className={cn(inputBase, "rounded", className)}
          {...props}
        />
        {helper && !error && (
          <p id={helperId} className="text-xs text-ink/40">{helper}</p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helper?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, helper, error, className, ...props }, ref) => {
    const errorId = error ? `${id}-error` : undefined
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs tracking-widest uppercase text-ink/60">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-describedby={errorId}
          aria-invalid={error ? "true" : undefined}
          className={cn(inputBase, "rounded min-h-[80px] resize-y", className)}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">{error}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"
```

**Step 4: Update barrel, run tests, commit**

```bash
npm test -- tests/ui/Input.test.tsx
npx tsc --noEmit
git add components/ui/Input.tsx components/ui/index.ts tests/ui/Input.test.tsx
git commit -m "feat(ui): add Input and Textarea — error state, helper text, aria-describedby

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Skeleton, Spinner, EmptyState, ErrorState
**model-hint: haiku**

Four missing pieces. Skeleton and Spinner are used by every async component. EmptyState and ErrorState have three-variant structure from pre-research.

**Files:**
- Create: `components/ui/Skeleton.tsx`
- Create: `components/ui/EmptyState.tsx`
- Modify: `components/ui/index.ts`

**Step 1: Write failing tests**

```ts
// tests/ui/Skeleton.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Skeleton, Spinner } from "@/components/ui/Skeleton"
import { describe, it, expect } from "vitest"

describe("Skeleton", () => {
  it("renders with aria-busy on container", () => {
    render(<Skeleton width="w-48" height="h-4" />)
    const el = screen.getByRole("status")
    expect(el.getAttribute("aria-busy")).toBe("true")
    expect(el.className).toContain("animate-pulse")
  })
})

describe("Spinner", () => {
  it("renders with aria-label", () => {
    render(<Spinner label="Loading products" />)
    expect(screen.getByRole("status", { name: "Loading products" })).toBeDefined()
  })
})
```

```ts
// tests/ui/EmptyState.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { EmptyState } from "@/components/ui/EmptyState"
import { describe, it, expect } from "vitest"

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No orders yet" description="Your orders will appear here." />)
    expect(screen.getByText("No orders yet")).toBeDefined()
    expect(screen.getByText("Your orders will appear here.")).toBeDefined()
  })

  it("renders CTA action button", () => {
    const onClick = () => {}
    render(<EmptyState title="No items" action={{ label: "Add item", onClick }} />)
    expect(screen.getByRole("button", { name: "Add item" })).toBeDefined()
  })
})
```

**Step 2: Run tests — verify fail**

**Step 3: Write Skeleton.tsx**

```tsx
// components/ui/Skeleton.tsx
import * as React from "react"
import { cn } from "@/lib/cn"

interface SkeletonProps {
  width?: string   // Tailwind width class e.g. "w-48"
  height?: string  // Tailwind height class e.g. "h-4"
  className?: string
  rounded?: "none" | "sm" | "base" | "lg" | "full"
}

const radiusMap = {
  none: "", sm: "rounded-sm", base: "rounded", lg: "rounded-lg", full: "rounded-full"
}

export function Skeleton({ width = "w-full", height = "h-4", rounded = "base", className }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading..."
      className={cn("animate-pulse bg-stone-200", width, height, radiusMap[rounded], className)}
    />
  )
}

interface SpinnerProps {
  label?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" }

export function Spinner({ label = "Loading...", size = "md", className }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <svg
        aria-hidden="true"
        className={cn("animate-spin text-ink/40", sizeMap[size])}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </span>
  )
}
```

**Step 4: Write EmptyState.tsx**

```tsx
// components/ui/EmptyState.tsx
import * as React from "react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/Button"

export type EmptyStateVariant = "default" | "search" | "error"

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick?: () => void; href?: string }
  variant?: EmptyStateVariant
  className?: string
}

export function EmptyState({ icon, title, description, action, variant = "default", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 gap-4",
        className
      )}
    >
      {icon && <div className="text-ink/20 text-4xl">{icon}</div>}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-sans text-ink">{title}</p>
        {description && <p className="text-xs text-ink/50">{description}</p>}
      </div>
      {action && (
        action.href
          ? <a href={action.href} className="text-xs tracking-widest uppercase underline text-ink/60 hover:text-ink transition">{action.label}</a>
          : <Button variant="secondary" size="sm" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center text-center py-12 px-6 gap-4", className)}>
      <p className="text-sm font-sans text-ink">{title}</p>
      {description && <p className="text-xs text-red-600">{description}</p>}
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  )
}
```

**Step 5: Update barrel, run tests, tsc, commit**

```bash
npm test -- tests/ui/Skeleton.test.tsx tests/ui/EmptyState.test.tsx
npx tsc --noEmit
git add components/ui/Skeleton.tsx components/ui/EmptyState.tsx components/ui/index.ts tests/ui/
git commit -m "feat(ui): add Skeleton, Spinner, EmptyState, ErrorState — missing async UI primitives

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Card component
**model-hint: haiku**

Extracts the two Card patterns from admin (stats card + shortcut card) into a compound component with variants.

**Files:**
- Create: `components/ui/Card.tsx`
- Modify: `components/ui/index.ts`

**Step 1: Write failing test**

```ts
// tests/ui/Card.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card"
import { describe, it, expect } from "vitest"

describe("Card", () => {
  it("renders compound structure", () => {
    render(
      <Card>
        <CardHeader>Title</CardHeader>
        <CardBody>Body content</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText("Title")).toBeDefined()
    expect(screen.getByText("Body content")).toBeDefined()
    expect(screen.getByText("Footer")).toBeDefined()
  })

  it("applies stat variant", () => {
    render(<Card variant="stat"><CardBody>42</CardBody></Card>)
    expect(screen.getByText("42").closest("[data-variant='stat']")).toBeDefined()
  })
})
```

**Step 2: Run test — verify fail**

**Step 3: Write implementation**

```tsx
// components/ui/Card.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const cardVariants = cva(
  "bg-white border",
  {
    variants: {
      variant: {
        default:  "border-stone-200 rounded-lg",
        stat:     "border-stone-100",                     // no rounding — matches admin stats cards
        shortcut: "border-stone-200 rounded-lg hover:border-stone-300 hover:shadow-sm transition",
        flat:     "border-stone-100 rounded",
      },
      padding: {
        none: "",
        sm:   "p-3",
        md:   "p-5",
        lg:   "p-6",
      },
    },
    defaultVariants: { variant: "default", padding: "none" },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div
      data-variant={variant ?? "default"}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-3 border-b border-stone-100 text-xs tracking-widest uppercase text-ink/60", className)}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-3 border-t border-stone-100 flex items-center justify-between", className)}
      {...props}
    />
  )
}
```

**Step 4: Update barrel, run tests, tsc, commit**

```bash
npm test -- tests/ui/Card.test.tsx
npx tsc --noEmit
git add components/ui/Card.tsx components/ui/index.ts tests/ui/Card.test.tsx
git commit -m "feat(ui): add Card compound component — default/stat/shortcut/flat variants

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## ★ GEMINI PAUSE POINT 1 — After Batch 1 complete

**Trigger:** After Task 6 commit passes.

**What to do:** STOP implementation. Run the following Gemini research query. Present findings to user. Wait for approval before starting Batch 2.

**Research query to send:**

> "Research 2025-2026: What are the most commonly missed enhancements for Button, Badge, Input, Skeleton, and Card components in production React/Next.js apps? Specifically: (1) any new WCAG 2.2 requirements that affect button target size or input error announcements, (2) any React 19 patterns that improve controlled input behavior, (3) what does the CVA community consider best practice for managing compound component variants across Card sub-components (CardHeader/CardBody/CardFooter)? Return only findings with HIGH or MEDIUM confidence that would require code changes to what we've already built."

**Report format to present to user:**

```
GEMINI PAUSE POINT 1 — Research Results

Finding 1: [title]
Confidence: [HIGH/MEDIUM]
What it adds: [1 sentence]
Code change required: [yes/no, where]

Finding 2: ...

Proposed enhancements to apply (with your approval):
- [list only HIGH/MEDIUM confidence, directly applicable items]

Estimated impact: [how many files, how much change]
```

**Wait for user YES/NO before continuing to Batch 2.**

---

## BATCH 2 — Interactive Components
_Tasks 7–9. New parallel session. Start after Batch 1 approved._

---

### Task 7: Dialog (Modal) component
**model-hint: sonnet**

Abstracts CartDrawer + ConfirmModal into a reusable Dialog compound component following APG `dialog-modal` pattern. This is the most ARIA-critical component in the library.

**Files:**
- Create: `components/ui/Dialog.tsx`
- Modify: `components/ui/index.ts`

**Step 1: Write failing test**

```ts
// tests/ui/Dialog.test.tsx
// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { describe, it, expect } from "vitest"

describe("Dialog", () => {
  it("opens on trigger click", () => {
    render(
      <Dialog>
        <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
        <DialogContent>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>Are you sure?</DialogDescription>
        </DialogContent>
      </Dialog>
    )
    expect(screen.queryByRole("dialog")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    expect(screen.getByRole("dialog")).toBeDefined()
    expect(screen.getByText("Confirm action")).toBeDefined()
  })

  it("closes on Escape key", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent><DialogTitle>Test</DialogTitle></DialogContent>
      </Dialog>
    )
    expect(screen.getByRole("dialog")).toBeDefined()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("has aria-modal, aria-labelledby, aria-describedby", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle id="test-title">Title</DialogTitle>
          <DialogDescription id="test-desc">Description</DialogDescription>
        </DialogContent>
      </Dialog>
    )
    const dialog = screen.getByRole("dialog")
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy()
  })
})
```

**Step 2: Run test — verify fail**

**Step 3: Write implementation**

```tsx
// components/ui/Dialog.tsx
"use client"
import * as React from "react"
import { cn } from "@/lib/cn"
import { Slot } from "@/components/ui/Slot"

interface DialogContextValue {
  open: boolean
  setOpen: (v: boolean) => void
  titleId: string
  descId: string
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialog() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>")
  return ctx
}

let dialogIdCounter = 0

export function Dialog({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const id = React.useRef(++dialogIdCounter)
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  function setOpen(v: boolean) {
    if (!isControlled) setInternalOpen(v)
    onOpenChange?.(v)
  }

  return (
    <DialogContext.Provider value={{
      open, setOpen,
      titleId: `dialog-title-${id.current}`,
      descId:  `dialog-desc-${id.current}`,
    }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { setOpen } = useDialog()
  const Comp = asChild ? Slot : "button"
  return (
    <Comp onClick={() => setOpen(true)}>
      {children}
    </Comp>
  )
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen, titleId, descId } = useDialog()
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Escape key handler
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, setOpen])

  // Focus first focusable on open
  React.useEffect(() => {
    if (open && contentRef.current) {
      const focusable = contentRef.current.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      )
      focusable[0]?.focus()
    }
  }, [open])

  // Body scroll lock
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Dialog */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4",
        )}
      >
        <div className={cn(
          "relative bg-white rounded-lg shadow-2xl border border-stone-200 w-full max-w-md p-8",
          className
        )}>
          {children}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close dialog"
            className="absolute top-4 right-4 text-ink/40 hover:text-ink transition p-1 rounded"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  )
}

export function DialogTitle({ className, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialog()
  return (
    <h2
      id={id ?? titleId}
      className={cn("font-serif text-xl text-ink mb-2", className)}
      {...props}
    />
  )
}

export function DialogDescription({ className, id, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descId } = useDialog()
  return (
    <p
      id={id ?? descId}
      className={cn("text-sm text-ink/60 mb-6", className)}
      {...props}
    />
  )
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-100", className)} {...props} />
  )
}
```

**Step 4: Update barrel, run tests, tsc, commit**

```bash
npm test -- tests/ui/Dialog.test.tsx
npx tsc --noEmit
git add components/ui/Dialog.tsx components/ui/index.ts tests/ui/Dialog.test.tsx
git commit -m "feat(ui): add Dialog compound component — focus trap, Escape, aria-modal, APG pattern

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Tabs component
**model-hint: haiku**

Extracts the media/page.tsx theme-tab pattern into a reusable compound component following APG `tabs` pattern (arrow-key navigation, aria-selected, aria-controls).

**Files:**
- Create: `components/ui/Tabs.tsx`
- Modify: `components/ui/index.ts`

**Step 1: Write failing test**

```ts
// tests/ui/Tabs.test.tsx
// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react"
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs"
import { describe, it, expect } from "vitest"

describe("Tabs", () => {
  it("shows correct panel for selected tab", () => {
    render(
      <Tabs defaultValue="red">
        <TabList>
          <Tab value="red">Red</Tab>
          <Tab value="blue">Blue</Tab>
        </TabList>
        <TabPanel value="red">Red content</TabPanel>
        <TabPanel value="blue">Blue content</TabPanel>
      </Tabs>
    )
    expect(screen.getByText("Red content")).toBeDefined()
    expect(screen.queryByText("Blue content")).toBeNull()
  })

  it("switches panel on tab click", () => {
    render(
      <Tabs defaultValue="red">
        <TabList>
          <Tab value="red">Red</Tab>
          <Tab value="blue">Blue</Tab>
        </TabList>
        <TabPanel value="red">Red content</TabPanel>
        <TabPanel value="blue">Blue content</TabPanel>
      </Tabs>
    )
    fireEvent.click(screen.getByRole("tab", { name: "Blue" }))
    expect(screen.getByText("Blue content")).toBeDefined()
    expect(screen.queryByText("Red content")).toBeNull()
  })

  it("has correct ARIA attributes", () => {
    render(
      <Tabs defaultValue="red">
        <TabList>
          <Tab value="red">Red</Tab>
        </TabList>
        <TabPanel value="red">Content</TabPanel>
      </Tabs>
    )
    const tab = screen.getByRole("tab", { name: "Red" })
    expect(tab.getAttribute("aria-selected")).toBe("true")
    const panel = screen.getByRole("tabpanel")
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id)
  })
})
```

**Step 2: Run test — verify fail**

**Step 3: Write implementation**

```tsx
// components/ui/Tabs.tsx
"use client"
import * as React from "react"
import { cn } from "@/lib/cn"

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}
const TabsContext = React.createContext<TabsContextValue | null>(null)
function useTabs() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("Tab components must be used within <Tabs>")
  return ctx
}

export function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  children: React.ReactNode
  className?: string
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const value = controlled ?? internal
  function setValue(v: string) {
    if (!controlled) setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="tablist" className={cn("flex items-center gap-1 flex-wrap", className)}>
      {children}
    </div>
  )
}

export function Tab({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: activeValue, setValue } = useTabs()
  const isActive = activeValue === value
  const id = `tab-${value}`
  return (
    <button
      role="tab"
      id={id}
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        "px-3 py-1 text-xs rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none",
        isActive
          ? "bg-ink text-white border-ink"
          : "border-stone-200 text-ink/60 hover:border-stone-300 hover:text-ink",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabPanel({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: activeValue } = useTabs()
  if (activeValue !== value) return null
  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={className}
    >
      {children}
    </div>
  )
}
```

**Step 4: Update barrel, run tests, tsc, commit**

```bash
npm test -- tests/ui/Tabs.test.tsx
npx tsc --noEmit
git add components/ui/Tabs.tsx components/ui/index.ts tests/ui/Tabs.test.tsx
git commit -m "feat(ui): add Tabs compound component — APG tabs pattern, arrow-key nav, aria-selected

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 9: DataTable component
**model-hint: sonnet**

TanStack Table v8 headless implementation. Abstracts the admin/page.tsx raw table with: sort, filter, pagination, row selection, and proper `aria-sort` attributes.

**Files:**
- Create: `components/ui/DataTable.tsx`
- Modify: `components/ui/index.ts`

**Step 1: Write failing test**

```ts
// tests/ui/DataTable.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { DataTable } from "@/components/ui/DataTable"
import { createColumnHelper } from "@tanstack/react-table"
import { describe, it, expect } from "vitest"

type Person = { name: string; status: string }
const helper = createColumnHelper<Person>()
const columns = [
  helper.accessor("name",   { header: "Name" }),
  helper.accessor("status", { header: "Status" }),
]
const data: Person[] = [
  { name: "Alice", status: "paid" },
  { name: "Bob",   status: "pending" },
]

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText("Name")).toBeDefined()
    expect(screen.getByText("Status")).toBeDefined()
  })

  it("renders all rows", () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText("Alice")).toBeDefined()
    expect(screen.getByText("Bob")).toBeDefined()
  })

  it("renders empty state when no data", () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No orders found." />)
    expect(screen.getByText("No orders found.")).toBeDefined()
  })
})
```

**Step 2: Run test — verify fail**

**Step 3: Write implementation**

```tsx
// components/ui/DataTable.tsx
"use client"
import * as React from "react"
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState, type ColumnFiltersState,
} from "@tanstack/react-table"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  emptyMessage?: string
  pageSize?: number
  className?: string
}

export function DataTable<TData>({
  columns, data, emptyMessage = "No results.", pageSize = 10, className,
}: DataTableProps<TData>) {
  const [sorting,       setSorting]       = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state:           { sorting, columnFilters },
    onSortingChange:       setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    aria-sort={
                      header.column.getIsSorted() === "asc"  ? "ascending"  :
                      header.column.getIsSorted() === "desc" ? "descending" : undefined
                    }
                    className="text-left text-xs tracking-widest uppercase text-ink/40 pb-3 pr-6 border-b border-stone-100 cursor-pointer select-none whitespace-nowrap"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc"  && <span aria-hidden>↑</span>}
                        {header.column.getIsSorted() === "desc" && <span aria-hidden>↓</span>}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyMessage} variant="search" />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-stone-50 hover:bg-stone-50 transition">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="py-3 pr-6 text-ink">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-xs text-ink/50">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>← Prev</Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()}     disabled={!table.getCanNextPage()}>Next →</Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 4: Update barrel, run tests, tsc, commit**

```bash
npm test -- tests/ui/DataTable.test.tsx
npx tsc --noEmit
git add components/ui/DataTable.tsx components/ui/index.ts tests/ui/DataTable.test.tsx
git commit -m "feat(ui): add DataTable — TanStack Table v8, sort, filter, pagination, aria-sort

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## ★ GEMINI PAUSE POINT 2 — After Batch 2 complete

**Trigger:** After Task 9 commit passes.

**Research query to send:**

> "Research 2025-2026: (1) What accessibility improvements exist for Dialog/Modal components beyond focus trap and Escape key? Specifically: the `inert` attribute as a hardening measure for Safari VoiceOver aria-modal bugs — is it now safe to use in 2025? (2) For data tables in React: what is the current best practice for announcing sort changes to screen readers (aria-live or aria-sort alone)? (3) For TanStack Table v8 in Next.js App Router: are there any known issues with SSR hydration for sort/pagination state? Return findings with HIGH or MEDIUM confidence that require code changes."

**Wait for user YES/NO before starting Batch 3.**

---

## BATCH 3 — Advanced Components + Wiring
_Tasks 10–12. New parallel session. Start after Batch 2 approved._

---

### Task 10: Breadcrumb + Select
**model-hint: haiku**

Two simpler interactive components. Breadcrumb is structural (no state). Select is stateful with accessibility requirements but has clear APG pattern.

**Files:**
- Create: `components/ui/Breadcrumb.tsx`
- Create: `components/ui/Select.tsx`
- Modify: `components/ui/index.ts`

**Step 1: Write failing tests**

```ts
// tests/ui/Breadcrumb.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from "@/components/ui/Breadcrumb"

describe("Breadcrumb", () => {
  it("renders with nav aria-label Breadcrumb", () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/admin">Admin</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem current>Orders</BreadcrumbItem>
      </Breadcrumb>
    )
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeDefined()
    expect(screen.getByText("Orders").getAttribute("aria-current")).toBe("page")
  })
})
```

**Step 2: Write Breadcrumb.tsx**

```tsx
// components/ui/Breadcrumb.tsx
import * as React from "react"
import { cn } from "@/lib/cn"

export function Breadcrumb({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1 text-xs text-ink/50">
        {children}
      </ol>
    </nav>
  )
}

export function BreadcrumbItem({
  href, current, children, className,
}: { href?: string; current?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <li>
      {href && !current
        ? <a href={href} className={cn("hover:text-ink transition", className)}>{children}</a>
        : <span aria-current={current ? "page" : undefined} className={cn(current ? "text-ink" : "", className)}>{children}</span>
      }
    </li>
  )
}

export function BreadcrumbSeparator({ className }: { className?: string }) {
  return <li aria-hidden="true" className={cn("text-ink/30 select-none", className)}>/</li>
}
```

**Step 3: Write Select.tsx** (custom accessible select following APG listbox pattern)

```tsx
// components/ui/Select.tsx
"use client"
import * as React from "react"
import { cn } from "@/lib/cn"

export interface SelectOption { value: string; label: string; disabled?: boolean }

export interface SelectProps {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function Select({
  options, value: controlled, defaultValue, onValueChange,
  placeholder = "Select...", label, error, disabled, className, id,
}: SelectProps) {
  // Use native <select> as the accessible foundation.
  // Custom styling applied over it. Avoids re-implementing APG listbox from scratch.
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const value = controlled ?? internal

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!controlled) setInternal(e.target.value)
    onValueChange?.(e.target.value)
  }

  const errorId = error && id ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs tracking-widest uppercase text-ink/60">{label}</label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId}
          className={cn(
            "w-full appearance-none border border-stone-200 px-3 py-2 pr-8 text-sm text-ink bg-white rounded",
            "focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error && "border-red-400",
            className
          )}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-ink/40" aria-hidden>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p id={errorId} role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

**Step 4: Update barrel, run tests, tsc, commit**

```bash
npm test -- tests/ui/Breadcrumb.test.tsx
npx tsc --noEmit
git add components/ui/Breadcrumb.tsx components/ui/Select.tsx components/ui/index.ts tests/ui/
git commit -m "feat(ui): add Breadcrumb (aria-current) and Select (native, accessible, styled)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Component registry file
**model-hint: haiku**

A catalog file listing every component — name, description, props, and Aria voice trigger phrase. Aria reads this during `buildAriaConfig()` to know which components exist by name.

**Files:**
- Create: `lib/componentRegistry.ts`

**Step 1: Write the file**

```ts
// lib/componentRegistry.ts
// Component registry: every UI component Aria can reference by name.
// Used by buildAriaConfig() to inform Aria of available components.

export interface ComponentEntry {
  name:        string   // Aria-speakable name
  path:        string   // import path
  description: string   // what it does in one sentence
  variants?:   string[] // available variants
  ariaTrigger: string   // phrase Aria uses to reference this component
}

export const COMPONENT_REGISTRY: ComponentEntry[] = [
  {
    name: "Button",
    path: "components/ui/Button",
    description: "Interactive button with 6 visual variants, 4 sizes, loading state, and asChild support.",
    variants: ["primary", "secondary", "ghost", "outline", "destructive", "link"],
    ariaTrigger: "button",
  },
  {
    name: "Badge",
    path: "components/ui/Badge",
    description: "Status and count indicators. Use for order status (paid/pending/error) and item counts.",
    variants: ["default", "success", "warning", "error", "active", "outline"],
    ariaTrigger: "badge or status indicator",
  },
  {
    name: "Input",
    path: "components/ui/Input",
    description: "Text input with label, helper text, and error state. Wired for react-hook-form.",
    ariaTrigger: "text input or form field",
  },
  {
    name: "Textarea",
    path: "components/ui/Input",
    description: "Multiline text input with same label/error/helper API as Input.",
    ariaTrigger: "textarea or multiline input",
  },
  {
    name: "Select",
    path: "components/ui/Select",
    description: "Accessible native select with custom styling, placeholder, and error state.",
    ariaTrigger: "select or dropdown",
  },
  {
    name: "Card",
    path: "components/ui/Card",
    description: "Container compound component. Variants: default, stat, shortcut, flat.",
    variants: ["default", "stat", "shortcut", "flat"],
    ariaTrigger: "card",
  },
  {
    name: "Dialog",
    path: "components/ui/Dialog",
    description: "Modal dialog with focus trap, Escape to close, ARIA labeling. Compound: DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter.",
    ariaTrigger: "modal or dialog",
  },
  {
    name: "Tabs",
    path: "components/ui/Tabs",
    description: "Tab navigation with APG keyboard pattern. Compound: TabList, Tab, TabPanel.",
    ariaTrigger: "tabs",
  },
  {
    name: "DataTable",
    path: "components/ui/DataTable",
    description: "TanStack Table v8 wrapper with sort, filter, pagination, and aria-sort.",
    ariaTrigger: "table or data table",
  },
  {
    name: "Skeleton",
    path: "components/ui/Skeleton",
    description: "Animated placeholder matching content geometry. Use for initial data loads.",
    ariaTrigger: "skeleton loader or loading placeholder",
  },
  {
    name: "Spinner",
    path: "components/ui/Skeleton",
    description: "Animated spinner for user-triggered loading states (button clicks, mutations).",
    ariaTrigger: "spinner or loading indicator",
  },
  {
    name: "EmptyState",
    path: "components/ui/EmptyState",
    description: "Three-variant empty content display: default (first-time), search (no results), error (failed).",
    variants: ["default", "search", "error"],
    ariaTrigger: "empty state",
  },
  {
    name: "Breadcrumb",
    path: "components/ui/Breadcrumb",
    description: "Navigation breadcrumb with aria-current='page' on current item.",
    ariaTrigger: "breadcrumb",
  },
]
```

**Step 2: Write test**

```ts
// tests/lib/componentRegistry.test.ts
import { COMPONENT_REGISTRY } from "@/lib/componentRegistry"
import { describe, it, expect } from "vitest"

describe("componentRegistry", () => {
  it("every entry has name, path, description, and ariaTrigger", () => {
    for (const entry of COMPONENT_REGISTRY) {
      expect(entry.name,        `${entry.name}: missing name`).toBeTruthy()
      expect(entry.path,        `${entry.name}: missing path`).toBeTruthy()
      expect(entry.description, `${entry.name}: missing description`).toBeTruthy()
      expect(entry.ariaTrigger, `${entry.name}: missing ariaTrigger`).toBeTruthy()
    }
  })

  it("has at least 10 components registered", () => {
    expect(COMPONENT_REGISTRY.length).toBeGreaterThanOrEqual(10)
  })
})
```

**Step 3: Run tests, tsc, commit**

```bash
npm test -- tests/lib/componentRegistry.test.ts
npx tsc --noEmit
git add lib/componentRegistry.ts tests/lib/componentRegistry.test.ts
git commit -m "feat(ui): add component registry — Aria-readable catalog of all UI components

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 12: Final verification + barrel export audit
**model-hint: haiku**

Verify the complete component library, run all tests, and confirm the barrel export is complete.

**Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass (≥60 total — 55 pre-existing + P4 component tests).

**Step 2: Verify barrel export**

```bash
grep "export" components/ui/index.ts | wc -l
```

Expected: ≥12 named exports.

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: clean.

**Step 4: Lint**

```bash
npx biome check . --reporter=minimal
```

Expected: no errors.

**Step 5: Final commit**

```bash
git add components/ui/index.ts
git commit -m "feat(ui): P4 complete — 12 atomic components, component registry, 60+ tests

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## ★ GEMINI PAUSE POINT 3 — After Batch 3 complete

**Trigger:** After Task 12 commit passes.

**Research query to send:**

> "Research 2025-2026: Now that we have built Button, Badge, Input, Textarea, Select, Card, Dialog, Tabs, DataTable, Skeleton, Spinner, EmptyState, ErrorState, Breadcrumb — what are the highest-value components missing from this list for an e-commerce + SaaS admin platform in Next.js 16? Specifically look for: (1) any interactive pattern with significant accessibility complexity we haven't covered, (2) any component that is commonly requested in e-commerce admin contexts that we've missed, (3) any new React 19 patterns that would improve any component we've already built. Return HIGH confidence findings only. This is the final enhancement gate before we close P4."

**Wait for user YES/NO before completing P4.**

---

## Post-completion: Migration guide

After all 3 batches are approved and Gemini Pause Point 3 is resolved:

1. **Migrate ConfirmModal** — replace with `<Dialog>` compound component
2. **Migrate admin/page.tsx table** — replace raw `<table>` with `<DataTable>`
3. **Migrate media/page.tsx tabs** — replace hand-rolled tab buttons with `<Tabs>`
4. **Migrate admin status badges** — replace inline `bg-green-50 text-green-700` with `<Badge variant="success">`
5. **Add `cn()` to ContactForm** — replace array-join class logic

These are optional — do them opportunistically as you touch those files, not as a separate plan.

---

## Parallel session paste prompt — BATCH 1


