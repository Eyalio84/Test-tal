import { COMPONENT_REGISTRY } from "@/lib/componentRegistry"
import { describe, it, expect } from "vitest"

describe("componentRegistry", () => {
  it("every entry has required fields", () => {
    for (const entry of COMPONENT_REGISTRY) {
      expect(entry.slug).toBeTruthy()
      expect(entry.name).toBeTruthy()
      expect(entry.category).toBeTruthy()
      expect(entry.description).toBeTruthy()
      expect(entry.ariaName).toBeTruthy()
      expect(entry.propsSchema).toBeDefined()
    }
  })

  it("has at least 30 components registered", () => {
    expect(COMPONENT_REGISTRY.length).toBeGreaterThanOrEqual(30)
  })
})
