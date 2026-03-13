import { describe, it, expect, beforeEach } from "vitest"
import { useShell } from "@/store/shell"

describe("Shell Store", () => {
  beforeEach(() => {
    useShell.setState({
      drawerOpen: false,
      activeTab: "home",
    })
  })

  it("starts with drawer closed and home tab", () => {
    expect(useShell.getState().drawerOpen).toBe(false)
    expect(useShell.getState().activeTab).toBe("home")
  })

  it("toggles drawer", () => {
    useShell.getState().toggleDrawer()
    expect(useShell.getState().drawerOpen).toBe(true)
    useShell.getState().toggleDrawer()
    expect(useShell.getState().drawerOpen).toBe(false)
  })

  it("sets drawer open state directly", () => {
    useShell.getState().setDrawerOpen(true)
    expect(useShell.getState().drawerOpen).toBe(true)
    useShell.getState().setDrawerOpen(false)
    expect(useShell.getState().drawerOpen).toBe(false)
  })

  it("sets active tab", () => {
    useShell.getState().setActiveTab("pages")
    expect(useShell.getState().activeTab).toBe("pages")
    useShell.getState().setActiveTab("aria")
    expect(useShell.getState().activeTab).toBe("aria")
  })
})
