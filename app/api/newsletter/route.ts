import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const existing = await prisma.siteContent.findUnique({ where: { id: "newsletter_subscribers" } })
  const list: string[] = existing ? JSON.parse(existing.value) : []

  if (list.includes(email)) {
    return NextResponse.json({ message: "Already subscribed" })
  }

  list.push(email)
  await prisma.siteContent.upsert({
    where: { id: "newsletter_subscribers" },
    update: { value: JSON.stringify(list), updatedAt: new Date() },
    create: { id: "newsletter_subscribers", value: JSON.stringify(list), updatedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
