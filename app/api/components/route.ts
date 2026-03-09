import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category")
    const search = request.nextUrl.searchParams.get("search")

    const where: Prisma.ComponentWhereInput = {}

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { ariaName: { contains: search, mode: "insensitive" } },
      ]
    }

    const components = await prisma.component.findMany({
      where,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(components)
  } catch (error) {
    console.error("Failed to fetch components:", error)
    return NextResponse.json(
      { error: "Failed to fetch components" },
      { status: 500 }
    )
  }
}
