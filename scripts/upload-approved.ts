/**
 * Upload approved images to R2 and update ThemeImage in DB.
 *
 * File convention:
 *   media/approved/{themeId}/{slot}.jpg   ← your approved image
 *
 * Usage:
 *   npm run upload:approved
 *   npm run upload:approved -- --theme bakery   # one theme only
 */
import "dotenv/config"
import fs   from "node:fs"
import path from "node:path"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2, R2_BUCKET, r2Key, r2Url } from "../lib/r2"
import { prisma } from "../lib/db"

const APPROVED_DIR = path.join(process.cwd(), "media", "approved")
const ARG_THEME    = (() => { const i = process.argv.indexOf("--theme"); return i !== -1 ? process.argv[i+1] : null })()

function mimeFromExt(ext: string): string {
  if (ext === "png")  return "image/png"
  if (ext === "webp") return "image/webp"
  return "image/jpeg"
}

async function main() {
  if (!fs.existsSync(APPROVED_DIR)) {
    console.log("No media/approved/ directory found. Nothing to upload.")
    return
  }

  const themeDirs = fs.readdirSync(APPROVED_DIR).filter((d) => {
    if (ARG_THEME && d !== ARG_THEME) return false
    return fs.statSync(path.join(APPROVED_DIR, d)).isDirectory()
  })

  let uploaded = 0

  for (const themeId of themeDirs) {
    console.log(`\n[${themeId}]`)
    const themeDir = path.join(APPROVED_DIR, themeId)
    const files = fs.readdirSync(themeDir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))

    for (const file of files) {
      const ext  = path.extname(file).replace(".", "").toLowerCase()
      const slot = path.basename(file, path.extname(file)) // filename without ext = slot
      const key  = r2Key(themeId, slot, ext === "jpeg" ? "jpg" : ext)
      const mime = mimeFromExt(ext === "jpeg" ? "jpg" : ext)

      console.log(`  ↑ upload ${themeId}/${slot}`)
      const buffer = fs.readFileSync(path.join(themeDir, file))

      await r2.send(new PutObjectCommand({
        Bucket:       R2_BUCKET,
        Key:          key,
        Body:         buffer,
        ContentType:  mime,
        CacheControl: "public, max-age=31536000, immutable",
      }))

      const url = r2Url(key)
      await prisma.themeImage.upsert({
        where:  { themeId_slot: { themeId, slot } },
        update: { r2Key: key, url },
        create: { themeId, slot, r2Key: key, url, alt: slot },
      })

      console.log(`  ✓ ${url}`)
      uploaded++
    }
  }

  console.log(`\n✓ Uploaded ${uploaded} approved image(s).\n`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
