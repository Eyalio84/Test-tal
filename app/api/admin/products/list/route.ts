import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Lightweight product list for Aria voice commands — name + price only
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const products = await prisma.product.findMany({
    select: { name: true, price: true, slug: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(products)
}
