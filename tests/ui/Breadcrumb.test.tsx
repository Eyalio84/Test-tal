// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from "@/components/ui/Breadcrumb"
import { describe, it, expect } from "vitest"

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
