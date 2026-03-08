import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { env } from "@/env"
import { z } from "zod"
import { THEME_IDS } from "@/lib/theme"

const querySchema = z.object({
  themeId: z.enum(THEME_IDS as [string, ...string[]]),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const parsed = querySchema.safeParse({
    themeId: req.nextUrl.searchParams.get("themeId"),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "themeId required" }, { status: 400 })
  }

  const images = await prisma.themeImage.findMany({
    where: { themeId: parsed.data.themeId },
    select: { slot: true, url: true, alt: true },
  })

  // Return as a slot→url map for easy lookup on the client
  const map: Record<string, string> = {}
  for (const img of images) map[img.slot] = img.url

  return NextResponse.json(map)
}
