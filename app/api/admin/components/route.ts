import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { env } from "@/env"
import { createComponentSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.email !== env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const validated = createComponentSchema.parse(body)

    const component = await prisma.component.create({
      data: validated as unknown as Prisma.ComponentCreateInput,
    })

    return NextResponse.json(component, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 409 }
        )
      }
    }
    console.error("Failed to create component:", error)
    return NextResponse.json(
      { error: "Failed to create component" },
      { status: 500 }
    )
  }
}
