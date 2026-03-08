/**
 * One-time migration: upload all theme images to Cloudflare R2.
 *
 * Usage:
 *   npm run migrate:images              # skip slots already in DB
 *   npm run migrate:images -- --force   # re-upload everything
 *
 * Requires .env.local with all CLOUDFLARE_R2_* keys set.
 */
import "dotenv/config"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { r2, R2_BUCKET, r2Key, r2Url } from "../lib/r2"
import { THEMES } from "../lib/theme"
import { prisma } from "../lib/db"

const FORCE = process.argv.includes("--force")

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const contentType = res.headers.get("content-type") ?? "image/jpeg"
  const buffer = Buffer.from(await res.arrayBuffer())
  return { buffer, contentType }
}

async function compressBuffer(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  const compressed = await sharp(buffer)
    .resize(800, undefined, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  return { buffer: compressed, contentType: "image/webp" }
}

async function uploadSlot(themeId: string, slot: string, imageUrl: string, alt = ""): Promise<"uploaded" | "skipped"> {
  // Skip if already migrated and not forcing
  if (!FORCE) {
    const existing = await prisma.themeImage.findUnique({ where: { themeId_slot: { themeId, slot } } })
    if (existing) {
      console.log(`  ↩  skip  ${themeId}/${slot} (already in DB)`)
      return "skipped"
    }
  }

  console.log(`  ↑  upload ${themeId}/${slot}`)
  const { buffer: rawBuffer } = await fetchImageBuffer(imageUrl)
  const { buffer, contentType } = await compressBuffer(rawBuffer)
  const key = r2Key(themeId, slot, "webp")  // always webp

  await r2.send(new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }))

  const url = r2Url(key)
  await prisma.themeImage.upsert({
    where:  { themeId_slot: { themeId, slot } },
    update: { r2Key: key, url, alt },
    create: { themeId, slot, r2Key: key, url, alt },
  })
  console.log(`  ✓  done  ${url}`)
  return "uploaded"
}

async function main() {
  console.log(`\nMigrating theme images to R2${FORCE ? " (force mode)" : ""}...\n`)
  let uploaded = 0
  let skipped  = 0
  const failed: string[] = []

  for (const [themeId, theme] of Object.entries(THEMES)) {
    console.log(`\n[${themeId}]`)

    const slots = [
      { slot: "hero", url: theme.hero.image, alt: theme.hero.imageAlt },
      ...theme.products.map(p => ({ slot: p.slug, url: p.image, alt: p.name })),
    ]

    for (const { slot, url, alt } of slots) {
      try {
        const result = await uploadSlot(themeId, slot, url, alt)
        if (result === "uploaded") uploaded++
        else skipped++
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.warn(`  ✗  fail  ${themeId}/${slot}: ${msg}`)
        failed.push(`${themeId}/${slot}`)
      }
    }
  }

  console.log(`\n─────────────────────────────────`)
  console.log(`✓ Uploaded: ${uploaded}  Skipped: ${skipped}  Failed: ${failed.length}`)
  if (failed.length > 0) {
    console.log(`\nFailed slots (fix source URL and re-run):`)
    failed.forEach(s => console.log(`  - ${s}`))
  }
  console.log()
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
