import { COMPONENT_REGISTRY } from "@/lib/componentRegistry"
import { describe, it, expect } from "vitest"

describe("componentRegistry", () => {
  it("every entry has name, path, description, and ariaTrigger", () => {
    for (const entry of COMPONENT_REGISTRY) {
      expect(entry.name,        `${entry.name}: missing name`).toBeTruthy()
      expect(entry.path,        `${entry.name}: missing path`).toBeTruthy()
      expect(entry.description, `${entry.name}: missing description`).toBeTruthy()
      expect(entry.ariaTrigger, `${entry.name}: missing ariaTrigger`).toBeTruthy()
    }
  })

  it("has at least 10 components registered", () => {
    expect(COMPONENT_REGISTRY.length).toBeGreaterThanOrEqual(10)
  })
})
