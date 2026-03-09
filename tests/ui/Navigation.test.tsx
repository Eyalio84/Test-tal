// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { Pagination } from "@/components/ui/Pagination"
import { SidebarNav } from "@/components/ui/SidebarNav"

describe("Pagination", () => {
  it("renders page buttons", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: /2/i })).toBeDefined()
  })

  it("marks current page with aria-current", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={() => {}}
      />
    )
    const currentBtn = screen.getByRole("button", { name: /2/i, current: "page" })
    expect(currentBtn).toBeDefined()
  })

  it("disables previous on first page", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={() => {}}
      />
    )
    const prevBtn = screen.getByLabelText("Previous page")
    expect(prevBtn).toHaveProperty("disabled", true)
  })

  it("disables next on last page", () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={() => {}}
      />
    )
    const nextBtn = screen.getByLabelText("Next page")
    expect(nextBtn).toHaveProperty("disabled", true)
  })

  it("calls onPageChange when page clicked", () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /^\s*2\s*$/ }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it("navigates with next button", () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
      />
    )
    fireEvent.click(screen.getByLabelText("Next page"))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})

describe("SidebarNav", () => {
  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/settings", label: "Settings" },
    { href: "/profile", label: "Profile" },
  ]

  it("renders navigation items", () => {
    render(<SidebarNav items={items} />)
    expect(screen.getByText("Dashboard")).toBeDefined()
    expect(screen.getByText("Settings")).toBeDefined()
    expect(screen.getByText("Profile")).toBeDefined()
  })

  it("renders links with correct href", () => {
    render(<SidebarNav items={items} />)
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i })
    expect(dashboardLink.getAttribute("href")).toBe("/dashboard")
  })

  it("shows collapse button when collapsible", () => {
    render(<SidebarNav items={items} collapsible />)
    expect(screen.getByLabelText(/collapse sidebar/i)).toBeDefined()
  })

  it("calls onNavigate when item clicked", () => {
    const onNavigate = vi.fn()
    render(<SidebarNav items={items} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText("Settings"))
    expect(onNavigate).toHaveBeenCalledWith("/settings")
  })

  it("supports icon rendering", () => {
    const itemsWithIcons = [
      { href: "/dashboard", label: "Dashboard", icon: <span data-testid="dashboard-icon">📊</span> },
    ]
    render(<SidebarNav items={itemsWithIcons} />)
    expect(screen.getByTestId("dashboard-icon")).toBeDefined()
  })
})
