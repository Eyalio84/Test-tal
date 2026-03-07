import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { customerId: true },
  })

  if (!user?.customerId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
  }

  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.customerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  })

  return NextResponse.json({ url: portalSession.url })
}
