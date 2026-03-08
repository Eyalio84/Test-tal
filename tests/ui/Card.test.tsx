// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card"
import { describe, it, expect } from "vitest"

describe("Card", () => {
  it("renders compound structure", () => {
    render(
      <Card>
        <CardHeader>Title</CardHeader>
        <CardBody>Body content</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText("Title")).toBeDefined()
    expect(screen.getByText("Body content")).toBeDefined()
    expect(screen.getByText("Footer")).toBeDefined()
  })

  it("applies stat variant", () => {
    render(<Card variant="stat"><CardBody>42</CardBody></Card>)
    expect(screen.getByText("42").closest("[data-variant='stat']")).toBeDefined()
  })
})
