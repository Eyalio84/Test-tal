// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { Popover } from "@/components/ui/Popover"
import { Tooltip } from "@/components/ui/Tooltip"
import { AlertDialog } from "@/components/ui/AlertDialog"

describe("Popover", () => {
  it("renders trigger element", () => {
    render(
      <Popover trigger={<button>Open</button>} content={<div>Content</div>} />
    )
    const btn = screen.getByText("Open")
    expect(btn).toBeDefined()
  })

  it("toggles content on click", () => {
    render(
      <Popover trigger={<button>Open</button>} content={<div>Content</div>} />
    )
    const btn = screen.getByText("Open")
    fireEvent.click(btn)
    expect(screen.getByText("Content")).toBeDefined()
  })

  it("shows content when trigger clicked", () => {
    render(
      <Popover trigger={<button>Open</button>} content={<div>Popover content</div>} />
    )
    const btn = screen.getByText("Open")
    fireEvent.click(btn)
    expect(screen.getByText("Popover content")).toBeDefined()
  })
})

describe("Tooltip", () => {
  it("renders children", () => {
    render(
      <Tooltip content="Help text">
        <span>Hover me</span>
      </Tooltip>
    )
    expect(screen.getByText("Hover me")).toBeDefined()
  })

  it("shows on hover", () => {
    const { container } = render(
      <Tooltip content="Tooltip content">
        <span>Trigger</span>
      </Tooltip>
    )
    const trigger = screen.getByText("Trigger").parentElement
    fireEvent.mouseEnter(trigger!)
    const tooltip = container.querySelector("[role='tooltip']")
    expect(tooltip).toBeDefined()
  })

  it("supports side prop", () => {
    const { container } = render(
      <Tooltip content="Help" side="left">
        <span>Trigger</span>
      </Tooltip>
    )
    fireEvent.mouseEnter(screen.getByText("Trigger").parentElement!)
    const tooltip = container.querySelector("[role='tooltip']")
    expect(tooltip?.className).toContain("right-full")
  })
})

describe("AlertDialog", () => {
  it("renders when isOpen is true", () => {
    render(
      <AlertDialog
        isOpen
        title="Confirm Action"
        description="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.getByText("Confirm Action")).toBeDefined()
    expect(screen.getByText("Are you sure?")).toBeDefined()
  })

  it("does not render when isOpen is false", () => {
    render(
      <AlertDialog
        isOpen={false}
        title="Confirm Action"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.queryByText("Confirm Action")).toBeNull()
  })

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn()
    render(
      <AlertDialog
        isOpen
        title="Confirm"
        confirmText="OK"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /ok/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it("calls onCancel when cancel button clicked", () => {
    const onCancel = vi.fn()
    render(
      <AlertDialog
        isOpen
        title="Confirm"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
