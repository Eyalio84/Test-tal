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
