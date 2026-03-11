import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { env } from "@/env"
import { r2, R2_BUCKET, r2Url } from "@/lib/r2"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "@/lib/db"
import { storeEmbedding } from "@/lib/embeddings"
import { compressImage } from "@/lib/compress"

// POST /api/admin/image-scout/upload
// Body: { imageUrl, themeId, slot, altText, prompt, source, pexelsId? }
// Downloads image → compresses to WebP → uploads to R2 → saves CdnImage + ThemeImage
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.email !== env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { imageUrl, themeId, slot, altText, prompt, source, pexelsId } = await req.json() as {
    imageUrl:  string
    themeId:   string
    slot:      string
    altText:   string
    prompt:    string
    source:    string
    pexelsId?: string
  }

  if (!imageUrl || !themeId || !slot) {
    return NextResponse.json({ error: "imageUrl, themeId, slot are required" }, { status: 400 })
  }

  // 1. Fetch the image
  const fetchRes = await fetch(imageUrl)
  if (!fetchRes.ok) {
    return NextResponse.json({ error: `Failed to fetch image: ${fetchRes.status}` }, { status: 502 })
  }
  const buffer = Buffer.from(await fetchRes.arrayBuffer())

  // 2. Compress to WebP via Sharp (lib/compress.ts pattern)
  let compressed: Buffer
  let contentType = "image/webp"
  try {
    const result = await compressImage(buffer, { width: 1600 })
    compressed   = result.buffer
    contentType  = result.contentType
  } catch {
    // If compress fails (e.g. unsupported format), use original
    compressed = buffer
  }

  // 3. Upload to R2
  const r2Key = `themes/${themeId}/${slot}.webp`
  await r2.send(new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         r2Key,
    Body:        compressed,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }))

  const publicUrl = r2Url(r2Key)

  // 4. Upsert ThemeImage (the existing CDN tracking model)
  await prisma.themeImage.upsert({
    where:  { themeId_slot: { themeId, slot } },
    create: { themeId, slot, r2Key, url: publicUrl, alt: altText },
    update: { r2Key, url: publicUrl, alt: altText },
  })

  // 5. Create CdnImage catalog entry
  const cdnImage = await prisma.cdnImage.upsert({
    where:  { r2Key },
    create: { r2Key, themeId, slot, prompt, source, altText, pexelsId: pexelsId ?? null },
    update: { prompt, source, altText, pexelsId: pexelsId ?? null },
  })

  // 6. Generate + store embedding (async, non-blocking for response)
  storeEmbedding(cdnImage.id, prompt, altText).catch((err: unknown) => {
    console.error("[image-scout] embedding store failed:", err)
  })

  return NextResponse.json({
    ok:     true,
    r2Key,
    url:    publicUrl,
    cdnImageId: cdnImage.id,
  })
}
