// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Input, Textarea } from "@/components/ui/Input"
import { describe, it, expect } from "vitest"

describe("Input", () => {
  it("renders input with label", () => {
    render(<Input label="Email" id="email" type="email" />)
    expect(screen.getByLabelText("Email")).toBeDefined()
  })

  it("shows error message with aria-describedby", () => {
    render(<Input label="Email" id="email" error="Invalid email" />)
    const input = screen.getByLabelText("Email")
    expect(input.getAttribute("aria-describedby")).toContain("email-error")
    expect(screen.getByText("Invalid email")).toBeDefined()
  })

  it("shows helper text", () => {
    render(<Input label="Name" id="name" helper="Full name as on ID" />)
    expect(screen.getByText("Full name as on ID")).toBeDefined()
  })
})
