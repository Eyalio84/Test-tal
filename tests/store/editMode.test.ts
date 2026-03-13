import { describe, it, expect, beforeEach } from "vitest"
import { useEditMode } from "@/store/editMode"

describe("editMode store", () => {
  beforeEach(() => {
    useEditMode.setState({ editMode: false, selectedSection: null, panelAnchor: null })
  })

  it("toggles editMode", () => {
    useEditMode.getState().toggleEditMode()
    expect(useEditMode.getState().editMode).toBe(true)
  })

  it("clears selection on toggle", () => {
    useEditMode.setState({
      selectedSection: "hero",
      panelAnchor: { top: 0, left: 0, width: 100, height: 50 },
    })
    useEditMode.getState().toggleEditMode()
    expect(useEditMode.getState().selectedSection).toBeNull()
    expect(useEditMode.getState().panelAnchor).toBeNull()
  })

  it("selectSection sets id and anchor", () => {
    const anchor = { top: 100, left: 0, width: 800, height: 200 }
    useEditMode.getState().selectSection("hero", anchor)
    expect(useEditMode.getState().selectedSection).toBe("hero")
    expect(useEditMode.getState().panelAnchor).toEqual(anchor)
  })

  it("clearSelection resets both", () => {
    useEditMode.setState({
      selectedSection: "cta",
      panelAnchor: { top: 0, left: 0, width: 100, height: 50 },
    })
    useEditMode.getState().clearSelection()
    expect(useEditMode.getState().selectedSection).toBeNull()
    expect(useEditMode.getState().panelAnchor).toBeNull()
  })
})
