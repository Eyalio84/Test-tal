// @vitest-environment jsdom
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
