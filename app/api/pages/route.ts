import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createPageSchema } from "@/lib/validations"

// GET /api/pages — list pages for authenticated user's site
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const site = await prisma.site.findFirst({ where: { ownerId: session.user.id }, select: { id: true } })
  if (!site) return NextResponse.json({ error: "no site found" }, { status: 404 })

  const pages = await prisma.page.findMany({
    where: { siteId: site.id },
    orderBy: { order: "asc" },
    include: { sections: { orderBy: { order: "asc" } } },
  })

  return NextResponse.json({ pages })
}

// POST /api/pages — create a new page
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const site = await prisma.site.findFirst({ where: { ownerId: session.user.id }, select: { id: true } })
  if (!site) return NextResponse.json({ error: "no site found" }, { status: 404 })

  const body = await req.json()
  const parsed = createPageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const page = await prisma.page.create({
    data: { ...parsed.data, siteId: site.id },
    include: { sections: true },
  })

  return NextResponse.json({ page }, { status: 201 })
}
