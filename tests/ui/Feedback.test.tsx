// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { FormContainer, FormField, FormError, FormSuccess } from "@/components/ui/Form"

describe("ProgressBar", () => {
  it("renders with value", () => {
    const { container } = render(<ProgressBar value={50} />)
    const bar = container.querySelector("[role='progressbar']")
    expect(bar).toBeDefined()
    expect(bar?.getAttribute("aria-valuenow")).toBe("50")
  })

  it("renders label and percentage", () => {
    render(<ProgressBar value={75} label="Upload" />)
    expect(screen.getByText("Upload")).toBeDefined()
    expect(screen.getByText("75%")).toBeDefined()
  })
})

describe("Form Components", () => {
  it("FormContainer renders title and description", () => {
    render(
      <FormContainer title="Contact Us" description="Get in touch">
        <input />
      </FormContainer>
    )
    expect(screen.getByText("Contact Us")).toBeDefined()
    expect(screen.getByText("Get in touch")).toBeDefined()
  })

  it("FormField renders label and required asterisk", () => {
    render(
      <FormField label="Email" name="email" required>
        <input id="email" />
      </FormField>
    )
    expect(screen.getByText("Email")).toBeDefined()
    expect(screen.getByText("*")).toBeDefined()
  })

  it("FormField shows error message", () => {
    render(
      <FormField label="Username" name="username" error="Already taken">
        <input id="username" />
      </FormField>
    )
    expect(screen.getByText("Already taken")).toBeDefined()
  })

  it("FormError renders error alert", () => {
    render(<FormError message="Please fix the errors" />)
    const alert = screen.getByRole("alert")
    expect(alert).toBeDefined()
    expect(alert.textContent).toContain("Please fix the errors")
  })

  it("FormSuccess renders success status", () => {
    render(<FormSuccess message="Saved successfully" />)
    const status = screen.getByRole("status")
    expect(status).toBeDefined()
    expect(status.textContent).toContain("Saved successfully")
  })
})
