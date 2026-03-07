import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const PRICE_MAP: Record<string, string | undefined> = {
  basic:   process.env.STRIPE_PRICE_BASIC,
  builder: process.env.STRIPE_PRICE_BUILDER,
  pro:     process.env.STRIPE_PRICE_PRO,
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const { tier } = await req.json() as { tier: "basic" | "builder" | "pro" }
  const priceId = PRICE_MAP[tier]
  if (!priceId) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscribed=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    metadata: { tier, userId: session.user.id },
    customer_email: session.user.email ?? undefined,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
