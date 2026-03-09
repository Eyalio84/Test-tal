// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Spinner } from "@/components/ui/Spinner"

describe("Spinner", () => {
  it("renders spinner SVG", () => {
    const { container } = render(<Spinner />)
    const svg = container.querySelector("svg")
    expect(svg).toBeDefined()
    expect(svg?.getAttribute("role")).toBe("img")
  })

  it("applies size classes", () => {
    const { container: containerSm } = render(<Spinner size="sm" />)
    const spinnerSm = containerSm.querySelector("svg")
    expect(spinnerSm?.className.baseVal).toContain("h-4")

    const { container: containerLg } = render(<Spinner size="lg" />)
    const spinnerLg = containerLg.querySelector("svg")
    expect(spinnerLg?.className.baseVal).toContain("h-8")
  })

  it("supports custom label", () => {
    render(<Spinner label="Saving..." />)
    const spinner = screen.getByRole("img", { name: /saving/i })
    expect(spinner).toBeDefined()
  })

  it("has default loading label", () => {
    render(<Spinner />)
    const spinner = screen.getByRole("img", { name: /loading/i })
    expect(spinner).toBeDefined()
  })
})
