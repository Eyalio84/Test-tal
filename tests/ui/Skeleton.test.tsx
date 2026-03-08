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
