import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2, R2_BUCKET, r2Key, r2Url } from "@/lib/r2"
import { prisma } from "@/lib/db"
import { env } from "@/env"
import { uploadSchema } from "@/lib/validations"
import { compressImage } from "@/lib/compress"

const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const form    = await req.formData()
  const file    = form.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large — max 5MB" }, { status: 413 })
  }

  const parsed = uploadSchema.safeParse({
    themeId: form.get("themeId"),
    slot:    form.get("slot"),
    alt:     form.get("alt") ?? "",
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { themeId, slot, alt } = parsed.data

  const rawBuffer = Buffer.from(await file.arrayBuffer())
  const { buffer, contentType } = await compressImage(rawBuffer)
  const key = r2Key(themeId, slot, "webp")  // always webp after compression

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
