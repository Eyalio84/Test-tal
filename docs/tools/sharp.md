# Sharp — Image Compression

## What it is

A Node.js image processing library (wraps libvips). Converts, resizes, and
compresses images at C speed — much faster than JavaScript-based alternatives.

## Why it's in StoreKit

Stock photos from Pexels/Unsplash are typically 3-8MB JPEGs. Serving those
directly from R2 means:
- Slow page loads (each product card loads a 4MB image)
- Higher R2 egress costs
- Poor Lighthouse performance scores

Sharp compresses them to WebP before upload. Typical results:
- A 4MB JPEG becomes a 150-300KB WebP — 90%+ size reduction
- No visible quality loss at quality=80

## Config file / wrapper

`lib/compress.ts`

```ts
export async function compressImage(
  input: Buffer,
  options: { width?: number; quality?: number } = {}
): Promise<{ buffer: Buffer; contentType: string }>
```

## Where it's used in StoreKit

| File | What it compresses |
|------|--------------------|
| `app/api/media/upload/route.ts` | Admin manual uploads |
| `scripts/migrate-images.ts` | Bulk migration from Unsplash/Pexels to R2 |
| `scripts/upload-approved.ts` | Uploading approved scout images to R2 |

## Usage

```ts
import { compressImage } from "@/lib/compress"

const rawBuffer = Buffer.from(await file.arrayBuffer())
const { buffer, contentType } = await compressImage(rawBuffer)
// buffer: compressed WebP
// contentType: "image/webp"
```

## Options

| Option | Default | Notes |
|--------|---------|-------|
| `width` | 800 | Max width in pixels. Height is proportional. Never upscales. |
| `quality` | 80 | WebP quality 1-100. 80 is visually indistinguishable from 100 for photos. |

## Changing defaults

To use larger images for hero slots:
```ts
const { buffer, contentType } = await compressImage(rawBuffer, { width: 1600, quality: 85 })
```

## Sharp pipeline reference

```ts
sharp(buffer)
  .resize(800, undefined, {
    fit: "inside",              // preserve aspect ratio
    withoutEnlargement: true,  // never upscale a small image
  })
  .webp({ quality: 80 })
  .toBuffer()
```

- `fit: "inside"` — both dimensions fit within the box, aspect ratio preserved
- `withoutEnlargement: true` — a 100×100 icon stays 100×100, not blown up to 800×800

Other formats Sharp can output: `.jpeg()`, `.png()`, `.avif()`, `.tiff()`
