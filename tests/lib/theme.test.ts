import { describe, it, expect } from "vitest"
import { THEMES, THEME_IDS } from "../../lib/theme"

// These tests are the programmatic equivalent of validate-themes.ts
// They run in CI and catch regressions when anyone edits a theme file.

describe("THEMES integrity", () => {
  for (const [themeId, theme] of Object.entries(THEMES)) {
    describe(themeId, () => {
      it("has 8 products", () => {
        expect(theme.products).toHaveLength(8)
      })

      it("all products have valid image URLs", () => {
        for (const p of theme.products) {
          expect(p.image, `"${p.name}" has invalid image`).toMatch(/^https:\/\//)
        }
      })

      it("all product slugs are unique", () => {
        const slugs = theme.products.map((p) => p.slug)
        const unique = new Set(slugs)
        expect(unique.size, "Duplicate slugs found").toBe(slugs.length)
      })

      it("no duplicate product image URLs", () => {
        const urls = theme.products.map((p) => p.image)
        const unique = new Set(urls)
        expect(unique.size, "Duplicate image URLs found").toBe(urls.length)
      })

      it("hero image is not reused as a product image", () => {
        const heroUrl = theme.hero.image
        const conflict = theme.products.find((p) => p.image === heroUrl)
        expect(conflict, `Hero image reused by "${conflict?.name}"`).toBeUndefined()
      })

      it("all products have non-negative price", () => {
        for (const p of theme.products) {
          expect(p.price, `"${p.name}" has negative price`).toBeGreaterThanOrEqual(0)
        }
      })
    })
  }
})

describe("THEME_IDS", () => {
  it("contains all 8 theme IDs", () => {
    expect(THEME_IDS).toHaveLength(8)
    expect(THEME_IDS).toContain("jewelry")
    expect(THEME_IDS).toContain("saas")
  })
})
