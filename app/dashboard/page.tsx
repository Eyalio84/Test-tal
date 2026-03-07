import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { Metadata } from "next"
import DashboardClient from "./DashboardClient"

export const metadata: Metadata = { title: "My Account" }

const TIER_LABELS: Record<string, string> = {
  free:    "Free",
  basic:   "Basic",
  builder: "Builder",
  pro:     "Pro",
}

const TIER_COLORS: Record<string, string> = {
  free:    "bg-stone-100 text-stone-600",
  basic:   "bg-sky-100 text-sky-700",
  builder: "bg-violet-100 text-violet-700",
  pro:     "bg-amber-100 text-amber-800",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")

  const [user, orders, memories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true, subscriptionId: true, customerId: true },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.ariaMemory.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    }),
  ])

  const tier = user?.subscriptionTier ?? "free"
  const totalSpent = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-serif text-2xl text-ink">
              Hey, {session.user.name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="text-sm text-ink/40 mt-0.5">{session.user.email}</p>
          </div>
          <span className={`inline-block px-3 py-1 text-xs font-medium tracking-wide rounded-sm ${TIER_COLORS[tier] ?? TIER_COLORS.free}`}>
            {TIER_LABELS[tier] ?? tier}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-stone-100 p-5">
            <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">Orders</p>
            <p className="font-serif text-2xl text-ink">{orders.length}</p>
          </div>
          <div className="bg-white border border-stone-100 p-5">
            <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">Total Spent</p>
            <p className="font-serif text-2xl text-ink">${totalSpent.toFixed(2)}</p>
          </div>
        </div>

        {/* Subscription card */}
        <div className="bg-white border border-stone-100 p-6 mb-8">
          <h2 className="font-serif text-lg text-ink mb-4">Subscription</h2>
          {tier === "free" ? (
            <div>
              <p className="text-sm text-ink/60 mb-4">
                Upgrade to unlock Aria memory, priority support, and more.
              </p>
              <div className="flex flex-wrap gap-3">
                {(["basic", "builder", "pro"] as const).map((t) => (
                  <DashboardClient key={t} action="subscribe" tier={t}
                    label={`Upgrade to ${TIER_LABELS[t]}`} />
                ))}
              </div>
              <p className="text-xs text-ink/30 mt-3">PayPal coming soon.</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/60">
                You&apos;re on the <strong className="text-ink">{TIER_LABELS[tier]}</strong> plan.
              </p>
              {user?.customerId && (
                <DashboardClient action="portal" label="Manage Plan" />
              )}
            </div>
          )}
        </div>

        {/* Aria memories */}
        <div className="bg-white border border-stone-100 p-6">
          <h2 className="font-serif text-lg text-ink mb-4">What Aria Remembers</h2>
          {tier === "free" ? (
            <p className="text-sm text-ink/40">
              Upgrade to let Aria remember your preferences between sessions.
            </p>
          ) : memories.length === 0 ? (
            <p className="text-sm text-ink/40">
              Aria hasn&apos;t saved anything yet — start chatting and she&apos;ll remember what matters.
            </p>
          ) : (
            <ul className="space-y-2">
              {memories.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-4 text-sm">
                  <span>
                    <span className="text-ink/40 font-medium">{m.key}:</span>{" "}
                    <span className="text-ink">{m.value}</span>
                  </span>
                  <DashboardClient action="forget" memoryKey={m.key} label="Forget" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
