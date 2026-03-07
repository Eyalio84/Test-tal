import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  let event: import("stripe").Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 })
  }

  // Idempotency — Stripe can deliver the same event more than once
  const seen = await prisma.webhookEvent.findUnique({ where: { id: event.id } })
  if (seen) return NextResponse.json({ received: true })
  await prisma.webhookEvent.create({ data: { id: event.id, type: event.type } })

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session
    const userId = session.metadata?.userId

    if (userId && userId !== "guest") {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      await prisma.order.create({
        data: {
          userId,
          stripeSessionId: session.id,
          status: "paid",
          total: (session.amount_total ?? 0) / 100,
          OrderItem: {
            create: lineItems.data.map((i) => ({
              productId: i.price?.metadata?.productId ?? "unknown",
              quantity: i.quantity ?? 1,
              price: (i.amount_total ?? 0) / 100,
            })),
          },
        },
      })
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as import("stripe").Stripe.Subscription
    const tier = (sub.metadata?.tier as string) ?? "basic"
    await prisma.user.updateMany({
      where: { customerId: sub.customer as string },
      data: { subscriptionTier: tier, subscriptionId: sub.id },
    })
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as import("stripe").Stripe.Subscription
    await prisma.user.updateMany({
      where: { subscriptionId: sub.id },
      data: { subscriptionTier: "free", subscriptionId: null },
    })
  }

  return NextResponse.json({ received: true })
}
