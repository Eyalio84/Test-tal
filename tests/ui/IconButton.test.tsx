// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { IconButton } from "@/components/ui/IconButton"

describe("IconButton", () => {
  it("renders with label", () => {
    render(<IconButton label="Close" />)
    const button = screen.getByRole("button", { name: /close/i })
    expect(button).toBeDefined()
  })

  it("applies variant classes", () => {
    render(<IconButton label="Test" variant="primary" />)
    const button = screen.getByRole("button")
    expect(button.className).toContain("bg-ink")
  })

  it("applies size classes", () => {
    render(<IconButton label="Test" size="lg" />)
    const button = screen.getByRole("button")
    expect(button.className).toContain("h-12")
    expect(button.className).toContain("w-12")
  })

  it("supports disabled state", () => {
    render(<IconButton label="Disabled" disabled />)
    const button = screen.getByRole("button", { name: /disabled/i })
    expect(button).toHaveProperty("disabled", true)
  })
})
