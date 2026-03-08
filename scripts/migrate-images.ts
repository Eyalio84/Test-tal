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

function extFromContentType(ct: string): string {
  if (ct.includes("png"))  return "png"
  if (ct.includes("webp")) return "webp"
  return "jpg"
}

async function uploadSlot(themeId: string, slot: string, imageUrl: string, alt = "") {
  // Skip if already migrated and not forcing
  if (!FORCE) {
    const existing = await prisma.themeImage.findUnique({ where: { themeId_slot: { themeId, slot } } })
    if (existing) {
      console.log(`  ↩  skip  ${themeId}/${slot} (already in DB)`)
      return
    }
  }

  console.log(`  ↑  upload ${themeId}/${slot}`)
  const { buffer, contentType } = await fetchImageBuffer(imageUrl)
  const ext = extFromContentType(contentType)
  const key = r2Key(themeId, slot, ext)

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
}

async function main() {
  console.log(`\nMigrating theme images to R2${FORCE ? " (force mode)" : ""}...\n`)
  let total = 0

  for (const [themeId, theme] of Object.entries(THEMES)) {
    console.log(`\n[${themeId}]`)

    // Hero
    await uploadSlot(themeId, "hero", theme.hero.image, theme.hero.imageAlt)
    total++

    // Products
    for (const product of theme.products) {
      await uploadSlot(themeId, product.slug, product.image, product.name)
      total++
    }
  }

  console.log(`\n✓ Migration complete — ${total} slots processed.\n`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
