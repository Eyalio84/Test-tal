import { describe, it, expect } from "vitest"
import { SECTION_REGISTRY } from "@/lib/sectionRegistry"
import { TEMPLATE_PAGES } from "@/lib/templatePages"

describe("Section Registry", () => {
  it("has entries", () => {
    expect(Object.keys(SECTION_REGISTRY).length).toBeGreaterThan(0)
  })

  it("all template section slugs have a registry entry", () => {
    const allSlugs = new Set<string>()
    for (const pages of Object.values(TEMPLATE_PAGES)) {
      for (const page of pages) {
        for (const section of page.sections) {
          allSlugs.add(section.componentSlug)
        }
      }
    }

    for (const slug of allSlugs) {
      expect(
        SECTION_REGISTRY[slug],
        `Missing registry entry for componentSlug: "${slug}"`,
      ).toBeDefined()
    }
  })
})
