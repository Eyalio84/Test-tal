import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2, R2_BUCKET, r2Key, r2Url } from "@/lib/r2"
import { prisma } from "@/lib/db"

const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const form = await req.formData()
  const file    = form.get("file")    as File   | null
  const themeId = form.get("themeId") as string | null
  const slot    = form.get("slot")    as string | null
  const alt     = (form.get("alt")    as string | null) ?? ""

  if (!file || !themeId || !slot) {
    return NextResponse.json({ error: "file, themeId, and slot are required" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large — max 5MB" }, { status: 413 })
  }

  const validThemes = ["jewelry","candy","bakery","flowers","wine","restaurant","portfolio","saas"]
  if (!validThemes.includes(themeId)) {
    return NextResponse.json({ error: "Invalid themeId" }, { status: 400 })
  }

  const contentType = file.type || "image/jpeg"
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
  const key = r2Key(themeId, slot, ext)
  const buffer = Buffer.from(await file.arrayBuffer())

  await r2.send(new PutObjectCommand({
    Bucket:       R2_BUCKET,
    Key:          key,
    Body:         buffer,
    ContentType:  contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }))

  const url = r2Url(key)

  await prisma.themeImage.upsert({
    where:  { themeId_slot: { themeId, slot } },
    update: { r2Key: key, url, alt },
    create: { themeId, slot, r2Key: key, url, alt },
  })

  return NextResponse.json({ ok: true, url })
}
