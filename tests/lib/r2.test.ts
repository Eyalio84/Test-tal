import { describe, it, expect } from "vitest"
import { r2Key } from "../../lib/r2"

// r2Key is a pure function — no env dependency
describe("r2Key", () => {
  it("builds the canonical key for a product slot", () => {
    expect(r2Key("jewelry", "hero", "jpg")).toBe("themes/jewelry/hero.jpg")
  })

  it("defaults to jpg extension", () => {
    expect(r2Key("candy", "gummy-bears")).toBe("themes/candy/gummy-bears.jpg")
  })

  it("supports webp extension", () => {
    expect(r2Key("bakery", "croissant-box-6", "webp")).toBe("themes/bakery/croissant-box-6.webp")
  })

  it("uses the slug as-is (no sanitisation needed — slugs are pre-validated)", () => {
    expect(r2Key("wine", "rose-provence", "webp")).toBe("themes/wine/rose-provence.webp")
  })
})
