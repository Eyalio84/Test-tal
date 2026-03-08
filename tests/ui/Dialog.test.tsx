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

  it("has aria-modal, aria-labelledby", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    )
    const dialog = screen.getByRole("dialog")
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy()
  })
})
