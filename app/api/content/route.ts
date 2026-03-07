import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { rateLimit, getClientIp as getRateIp } from "@/lib/rateLimit"


// GET /api/content — returns SiteContent
// ?view=draft (admin only) → draft values (global, for the admin editor)
// default, authenticated   → live values scoped to caller's site, falling back to global rows (siteId IS NULL)
// default, anonymous       → live values from global rows only
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const wantDraft = searchParams.get("view") === "draft"

  const session = await auth()

  if (wantDraft) {
    // Admin editor path — return all global content unchanged
    if (session?.user?.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    const rows = await prisma.siteContent.findMany()
    const content: Record<string, string> = {}
    for (const row of rows) content[row.id] = row.draft
    return NextResponse.json({ content })
  }

  // Resolve the caller's siteId (null for anonymous or users without a site)
  const siteId = session?.user?.id
    ? (await prisma.site.findFirst({ where: { ownerId: session.user.id }, select: { id: true } }))?.id ?? null
    : null

  // Fetch global rows + site-specific rows (if siteId is known)
  const rows = await prisma.siteContent.findMany({
    where: siteId ? { OR: [{ siteId }, { siteId: null }] } : { siteId: null },
  })

  // Site-specific rows override global (null siteId) ones for the same key
  const content: Record<string, string> = {}
  for (const row of rows) {
    const val = row.live
    // A site-specific row always wins over a global row
    if (content[row.id] === undefined || row.siteId === siteId) {
      content[row.id] = val
    }
  }

  return NextResponse.json({ content })
}

// PATCH /api/content — update one key's draft value, save snapshot
// Body: { key: string, value: string }
// NOTE: This is the admin editor path — writes are global (siteId: null).
//       Member-scoped content writes (per-siteId) are future work.
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
