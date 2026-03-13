import { describe, it, expect } from "vitest"
import { SECTION_MAP } from "@/lib/sectionMap"

describe("SECTION_MAP", () => {
  it("all entries have required fields", () => {
    for (const [id, config] of Object.entries(SECTION_MAP)) {
      expect(config.label, `${id} missing label`).toBeTruthy()
      expect(config.keys.length, `${id} has no keys`).toBeGreaterThan(0)
      expect(["text", "image", "color", "order"]).toContain(config.module)
    }
  })

  it("has at least one text section", () => {
    const textSections = Object.entries(SECTION_MAP).filter(([, config]) => config.module === "text")
    expect(textSections.length).toBeGreaterThan(0)
  })

  it("sections have unique IDs", () => {
    const ids = Object.keys(SECTION_MAP)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
