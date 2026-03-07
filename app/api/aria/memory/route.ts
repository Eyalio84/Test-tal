import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.subscriptionTier === "free") {
    return NextResponse.json({ error: "upgrade_required" }, { status: 403 })
  }

  const memories = await prisma.ariaMemory.findMany({
    where: { userId: session.user.id },
    select: { key: true, value: true },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ memories })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.subscriptionTier === "free") {
    return NextResponse.json({ error: "upgrade_required" }, { status: 403 })
  }

  const { key, value } = await req.json()
  if (!key || !value) {
    return NextResponse.json({ error: "key and value are required" }, { status: 400 })
  }

  await prisma.ariaMemory.upsert({
    where: { userId_key: { userId: session.user.id, key } },
    update: { value },
    create: { userId: session.user.id, key, value },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { key } = await req.json()
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 })
  }

  await prisma.ariaMemory.deleteMany({
    where: { userId: session.user.id, key },
  })

  return NextResponse.json({ success: true })
}
