import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { rateLimit, getClientIp as getRateIp } from "@/lib/rateLimit"


// GET /api/content — returns all SiteContent
// ?view=draft (admin only) → draft values
// default                  → live values (public)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const wantDraft = searchParams.get("view") === "draft"

  if (wantDraft) {
    const session = await auth()
    if (session?.user?.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
  }

  const rows = await prisma.siteContent.findMany()
  const content: Record<string, string> = {}
  for (const row of rows) {
    content[row.id] = wantDraft ? row.draft : row.live
  }
  return NextResponse.json({ content })
}

// PATCH /api/content — update one key's draft value, save snapshot
// Body: { key: string, value: string }
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const ip = getRateIp(req)
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const body = await req.json() as { key?: string; value?: string }
  if (!body.key || body.value === undefined) {
    return NextResponse.json({ error: "key and value required" }, { status: 400 })
  }

  // Snapshot current draft state before applying change
  const allRows = await prisma.siteContent.findMany()
  const snapshot: Record<string, string> = {}
  for (const row of allRows) snapshot[row.id] = row.draft

  const savedSnapshot = await prisma.siteSnapshot.create({
    data: { contentJson: JSON.stringify(snapshot) },
  })

  // Trim snapshots to 10 most recent
  const old = await prisma.siteSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    skip: 10,
    select: { id: true },
  })
  if (old.length > 0) {
    await prisma.siteSnapshot.deleteMany({ where: { id: { in: old.map((o) => o.id) } } })
  }

  // Apply draft change
  await prisma.siteContent.upsert({
    where: { id: body.key },
    update: { draft: body.value, lastEditedBy: session!.user?.email ?? null },
    create: { id: body.key, draft: body.value, live: "", lastEditedBy: session!.user?.email ?? null },
  })

  return NextResponse.json({ ok: true, snapshotId: savedSnapshot.id })
}
