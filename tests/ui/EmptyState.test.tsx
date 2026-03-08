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
