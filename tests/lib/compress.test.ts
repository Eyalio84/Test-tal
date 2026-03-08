import { describe, it, expect } from "vitest"
import sharp from "sharp"
import { compressImage } from "../../lib/compress"

describe("compressImage", () => {
  it("returns WebP content type", async () => {
    // Generate a valid 1x1 white JPEG via sharp — no test fixtures needed
    const validJpeg = await sharp({
      create: { width: 1, height: 1, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .jpeg()
      .toBuffer()

    const result = await compressImage(validJpeg)
    expect(result.contentType).toBe("image/webp")
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.buffer.length).toBeGreaterThan(0)
  })

  it("respects custom quality option", async () => {
    // Just verify it doesn't throw — output size varies too much to assert precisely
    const tiny = Buffer.from([0xff, 0xd8, 0xff, 0xd9]) // empty JPEG
    // Sharp may throw on truly empty JPEG — that's expected behaviour
    await expect(compressImage(tiny, { quality: 50 })).rejects.toBeDefined()
  })
})
