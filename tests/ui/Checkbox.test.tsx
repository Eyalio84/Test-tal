// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Checkbox, Radio } from "@/components/ui/Checkbox"

describe("Checkbox", () => {
  it("renders checkbox input", () => {
    render(<Checkbox id="agree" label="I agree" />)
    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).toBeDefined()
  })

  it("renders with label", () => {
    render(<Checkbox id="agree" label="I agree" />)
    const label = screen.getByText("I agree")
    expect(label).toBeDefined()
  })

  it("shows error message", () => {
    render(<Checkbox id="agree" error="Required" />)
    const error = screen.getByRole("alert")
    expect(error).toBeDefined()
    expect(error.textContent).toContain("Required")
  })
})

describe("Radio", () => {
  it("renders radio input", () => {
    render(<Radio id="option1" name="choice" label="Option 1" />)
    const radio = screen.getByRole("radio")
    expect(radio).toBeDefined()
  })

  it("renders with label", () => {
    render(<Radio id="option1" name="choice" label="Option 1" />)
    const label = screen.getByText("Option 1")
    expect(label).toBeDefined()
  })

  it("supports helper text", () => {
    render(<Radio id="option1" name="choice" label="Option" helper="Choose this" />)
    const helper = screen.getByText("Choose this")
    expect(helper).toBeDefined()
  })
})
