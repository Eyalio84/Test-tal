// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react"
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs"
import { describe, it, expect } from "vitest"

describe("Tabs", () => {
  it("shows correct panel for selected tab", () => {
    render(
      <Tabs defaultValue="red">
        <TabList>
          <Tab value="red">Red</Tab>
          <Tab value="blue">Blue</Tab>
        </TabList>
        <TabPanel value="red">Red content</TabPanel>
        <TabPanel value="blue">Blue content</TabPanel>
      </Tabs>
    )
    expect(screen.getByText("Red content")).toBeDefined()
    expect(screen.queryByText("Blue content")).toBeNull()
  })

  it("switches panel on tab click", () => {
    render(
      <Tabs defaultValue="red">
        <TabList>
          <Tab value="red">Red</Tab>
          <Tab value="blue">Blue</Tab>
        </TabList>
        <TabPanel value="red">Red content</TabPanel>
        <TabPanel value="blue">Blue content</TabPanel>
      </Tabs>
    )
    fireEvent.click(screen.getByRole("tab", { name: "Blue" }))
    expect(screen.getByText("Blue content")).toBeDefined()
    expect(screen.queryByText("Red content")).toBeNull()
  })

  it("has correct ARIA attributes", () => {
    render(
      <Tabs defaultValue="red">
        <TabList>
          <Tab value="red">Red</Tab>
        </TabList>
        <TabPanel value="red">Content</TabPanel>
      </Tabs>
    )
    const tab = screen.getByRole("tab", { name: "Red" })
    expect(tab.getAttribute("aria-selected")).toBe("true")
    const panel = screen.getByRole("tabpanel")
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id)
  })
})
