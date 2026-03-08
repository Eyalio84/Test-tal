// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { DataTable } from "@/components/ui/DataTable"
import { createColumnHelper } from "@tanstack/react-table"
import { describe, it, expect } from "vitest"

type Person = { name: string; status: string }
const helper = createColumnHelper<Person>()
const columns = [
  helper.accessor("name",   { header: "Name" }),
  helper.accessor("status", { header: "Status" }),
]
const data: Person[] = [
  { name: "Alice", status: "paid" },
  { name: "Bob",   status: "pending" },
]

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText("Name")).toBeDefined()
    expect(screen.getByText("Status")).toBeDefined()
  })

  it("renders all rows", () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText("Alice")).toBeDefined()
    expect(screen.getByText("Bob")).toBeDefined()
  })

  it("renders empty state when no data", () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No orders found." />)
    expect(screen.getByText("No orders found.")).toBeDefined()
  })
})
