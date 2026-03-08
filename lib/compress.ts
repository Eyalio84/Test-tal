import sharp from "sharp"

/**
 * Compress any image buffer to WebP before uploading to R2.
 *
 * - Resizes to max 800px wide (preserves aspect ratio, never upscales)
 * - Converts to WebP at quality 80 — typically 70-90% smaller than source JPEG
 * - Returns the compressed buffer + updated content-type
 *
 * Usage:
 *   const { buffer, contentType } = await compressImage(rawBuffer)
 *   // use buffer + contentType in PutObjectCommand
 */
export async function compressImage(
  input: Buffer,
  options: { width?: number; quality?: number } = {}
): Promise<{ buffer: Buffer; contentType: string }> {
  const buffer = await sharp(input)
    .resize(options.width ?? 800, undefined, {
      fit:               "inside",
      withoutEnlargement: true,   // never upscale a small image
    })
    .webp({ quality: options.quality ?? 80 })
    .toBuffer()

  return { buffer, contentType: "image/webp" }
}
