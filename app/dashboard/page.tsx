import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { Metadata } from "next"
import DashboardClient from "./DashboardClient"
import DashboardAriaPanel from "./DashboardAriaPanel"

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

const NAV_LINKS = [
  { label: "Home",        href: "/" },
  { label: "Products",    href: "/products" },
  { label: "Collections", href: "/collections" },
  { label: "About",       href: "/about" },
  { label: "Settings",    href: "/admin" },
]

const QUICK_ACTIONS = [
  { label: "Edit by voice",  href: null,              dataAction: "aria" },
  { label: "Open editor",    href: "/admin/editor",   dataAction: null },
  { label: "View live site", href: "/",               dataAction: null },
  { label: "Switch theme",   href: "/admin/themes",   dataAction: null },
  { label: "Add product",    href: "/admin",           dataAction: null },
  { label: "Manage plan",    href: "/dashboard",       dataAction: null },
]

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")

  const [user, orders, memories, site] = await Promise.all([
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
    prisma.site.findFirst({ where: { ownerId: session.user.id } }),
  ])

  const tier = user?.subscriptionTier ?? "free"
  const totalSpent = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
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

        {/* 3-column workspace grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* ── Left column: Site nav links (col-span-2) — hidden on mobile (navbar covers it) ── */}
          <aside className="hidden md:block md:col-span-2">
            <nav className="bg-white border border-stone-100 p-4">
              <p className="text-[10px] tracking-widest uppercase text-ink/30 mb-3">Site</p>
              <ul className="space-y-1">
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="block text-sm text-ink/70 hover:text-ink py-1.5 px-2 hover:bg-stone-50 transition-colors rounded-sm"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ── Center column: Site overview + quick actions (col-span-7) ── */}
          <main className="order-2 md:order-none md:col-span-7 flex flex-col gap-6">

            {/* Site overview card */}
            <div className="bg-white border border-stone-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-serif text-xl text-ink">
                  {site?.name ?? "My Site"}
                </h2>
                {site?.themeId && (
                  <span className="text-[10px] tracking-widest uppercase bg-stone-100 text-stone-500 px-2 py-1 rounded-sm">
                    {site.themeId}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-stone-50 border border-stone-100 p-4">
                  <p className="text-[10px] tracking-widest uppercase text-ink/40 mb-1">Orders</p>
                  <p className="font-serif text-2xl text-ink">{orders.length}</p>
                </div>
                <div className="bg-stone-50 border border-stone-100 p-4">
                  <p className="text-[10px] tracking-widest uppercase text-ink/40 mb-1">Total Spent</p>
                  <p className="font-serif text-2xl text-ink">${totalSpent.toFixed(2)}</p>
                </div>
              </div>

              {/* Quick actions grid (2 cols × 3 rows) */}
              <p className="text-[10px] tracking-widest uppercase text-ink/30 mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_ACTIONS.map(({ label, href, dataAction }) =>
                  href ? (
                    <Link
                      key={label}
                      href={href}
                      data-action={dataAction ?? undefined}
                      className="text-sm text-ink/70 border border-stone-100 rounded-sm px-3 py-2.5 hover:bg-stone-50 hover:text-ink transition-colors text-center"
                    >
                      {label}
                    </Link>
                  ) : (
                    <button
                      key={label}
                      data-action={dataAction ?? undefined}
                      className="text-sm text-ink/70 border border-stone-100 rounded-sm px-3 py-2.5 hover:bg-stone-50 hover:text-ink transition-colors text-center"
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Subscription card */}
            <div id="billing" className="bg-white border border-stone-100 p-6">
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
          </main>

          {/* ── Right column: Aria invite panel (col-span-3) — first on mobile ── */}
          <aside className="order-1 md:order-none md:col-span-3">
            <DashboardAriaPanel />
          </aside>

        </div>
      </div>
    </div>
  )
}
