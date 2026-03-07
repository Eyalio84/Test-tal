import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { rateLimit, getClientIp } from "@/lib/rateLimit"

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!rateLimit(ip, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { email } = await req.json()
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const existing = await prisma.siteContent.findUnique({ where: { id: "newsletter_subscribers" } })
  const list: string[] = existing ? JSON.parse(existing.live || "[]") : []

  if (list.includes(email)) {
    return NextResponse.json({ message: "Already subscribed" })
  }

  list.push(email)
  const serialized = JSON.stringify(list)
  await prisma.siteContent.upsert({
    where: { id: "newsletter_subscribers" },
    update: { draft: serialized, live: serialized },
    create: { id: "newsletter_subscribers", draft: serialized, live: serialized },
  })

  return NextResponse.json({ success: true })
}
