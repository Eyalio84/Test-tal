import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { env } from "@/env"
import { updateComponentSchema } from "@/lib/validations"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (session?.user?.email !== env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const validated = updateComponentSchema.parse(body)

    const component = await prisma.component.update({
      where: { id: params.id },
      data: validated as unknown as Prisma.ComponentUpdateInput,
    })

    return NextResponse.json(component)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Component not found" },
          { status: 404 }
        )
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 409 }
        )
      }
    }
    console.error("Failed to update component:", error)
    return NextResponse.json(
      { error: "Failed to update component" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (session?.user?.email !== env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.component.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Component not found" },
          { status: 404 }
        )
      }
    }
    console.error("Failed to delete component:", error)
    return NextResponse.json(
      { error: "Failed to delete component" },
      { status: 500 }
    )
  }
}
