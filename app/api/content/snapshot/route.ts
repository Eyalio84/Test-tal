import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/content/snapshot — list snapshots (for history UI, newest first)
export async function GET() {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const snapshots = await prisma.siteSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, createdAt: true },
  })

  return NextResponse.json({ snapshots })
}

// POST /api/content/snapshot
// { action: "create" }           → snapshot current draft state, return { id }
// { snapshotId: string }         → restore that snapshot as current draft
export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = await req.json() as { action?: string; snapshotId?: string }

  // Create snapshot of current draft state (used before undo/redo to capture current position)
  if (body.action === "create") {
    const rows = await prisma.siteContent.findMany()
    const contentJson: Record<string, string> = {}
    for (const row of rows) contentJson[row.id] = row.draft
    const snap = await prisma.siteSnapshot.create({ data: { contentJson: JSON.stringify(contentJson) } })
    return NextResponse.json({ id: snap.id })
  }

  if (!body.snapshotId) {
    return NextResponse.json({ error: "snapshotId or action required" }, { status: 400 })
  }

  const snapshot = await prisma.siteSnapshot.findUnique({ where: { id: body.snapshotId } })
  if (!snapshot) {
    return NextResponse.json({ error: "snapshot not found" }, { status: 404 })
  }

  const content = JSON.parse(snapshot.contentJson) as Record<string, string>

  // Restore each key's draft value
  await Promise.all(
    Object.entries(content).map(([key, value]) =>
      prisma.siteContent.upsert({
        where: { id: key },
        update: { draft: value, lastEditedBy: session!.user?.email ?? null },
        create: { id: key, draft: value, live: "", lastEditedBy: session!.user?.email ?? null },
      })
    )
  )

  return NextResponse.json({ ok: true, restoredKeys: Object.keys(content).length, content })
}
