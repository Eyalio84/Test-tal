import { describe, it, expect, beforeEach } from "vitest"
import { useCanvas } from "@/store/canvas"

describe("Canvas Store — Persistence", () => {
  beforeEach(() => {
    useCanvas.setState({
      instances: [],
      pageId: null,
      isDirty: false,
    })
  })

  it("starts with no pageId and clean state", () => {
    const state = useCanvas.getState()
    expect(state.pageId).toBeNull()
    expect(state.isDirty).toBe(false)
    expect(state.instances).toEqual([])
  })

  it("hydrates from sections", () => {
    const sections = [
      { id: "s1", componentSlug: "hero-section", props: { variant: "compact" }, order: 0 },
      { id: "s2", componentSlug: "cta-section", props: {}, order: 1 },
    ]

    useCanvas.getState().hydrateFromSections("page-123", sections)
    const state = useCanvas.getState()

    expect(state.pageId).toBe("page-123")
    expect(state.isDirty).toBe(false)
    expect(state.instances).toHaveLength(2)
    expect(state.instances[0].slug).toBe("hero-section")
    expect(state.instances[1].slug).toBe("cta-section")
  })

  it("sorts sections by order when hydrating", () => {
    const sections = [
      { id: "s2", componentSlug: "cta-section", props: {}, order: 1 },
      { id: "s1", componentSlug: "hero-section", props: {}, order: 0 },
    ]

    useCanvas.getState().hydrateFromSections("page-123", sections)
    const state = useCanvas.getState()

    expect(state.instances[0].slug).toBe("hero-section")
    expect(state.instances[1].slug).toBe("cta-section")
  })

  it("marks dirty on addComponent", () => {
    useCanvas.getState().addComponent("button", { label: "hi" })
    expect(useCanvas.getState().isDirty).toBe(true)
  })

  it("marks dirty on updateComponent", () => {
    const id = useCanvas.getState().addComponent("button", { label: "hi" })
    useCanvas.setState({ isDirty: false })
    useCanvas.getState().updateComponent(id, { label: "bye" })
    expect(useCanvas.getState().isDirty).toBe(true)
  })

  it("marks dirty on removeComponent", () => {
    const id = useCanvas.getState().addComponent("button", { label: "hi" })
    useCanvas.setState({ isDirty: false })
    useCanvas.getState().removeComponent(id)
    expect(useCanvas.getState().isDirty).toBe(true)
  })

  it("marks dirty on reorderComponent", () => {
    useCanvas.getState().addComponent("a", {})
    const id2 = useCanvas.getState().addComponent("b", {})
    useCanvas.setState({ isDirty: false })
    useCanvas.getState().reorderComponent(id2, 0)
    expect(useCanvas.getState().isDirty).toBe(true)
  })
})
