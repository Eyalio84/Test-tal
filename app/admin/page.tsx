import type { Metadata } from "next"
import Link   from "next/link"
import { prisma } from "@/lib/db"
import { getActiveTheme } from "@/lib/getActiveTheme"

export const metadata: Metadata = { title: "Admin" }

export default async function AdminPage() {
  const [activeTheme, orders, productCount, revenueAgg] = await Promise.all([
    getActiveTheme(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { User: { select: { email: true, name: true } } },
    }),
    prisma.product.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "paid" } }),
  ])

  const revenue  = revenueAgg._sum.total ?? 0
  const paidCount = orders.filter((o) => o.status === "paid").length

  const stats = [
    { label: "Total Orders",  value: String(orders.length) },
    { label: "Paid Orders",   value: String(paidCount) },
    { label: "Revenue",       value: `$${revenue.toFixed(2)}` },
    { label: "Products",      value: String(productCount) },
  ]

  return (
    <div>
      {/* Theme shortcut */}
      <Link
        href="/admin/themes"
        className="flex items-center gap-3 mb-4 px-5 py-4 bg-white border border-stone-200 rounded-lg hover:border-stone-300 hover:shadow-sm transition group"
      >
        <span className="text-2xl">🎨</span>
        <div className="flex-1">
          <div className="font-medium text-sm text-ink">Active Theme</div>
          <div className="text-xs text-ink/40">{activeTheme.brand.name} — {activeTheme.brand.tagline}</div>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-stone-100 text-ink/60">{activeTheme.id}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-stone-400 group-hover:text-ink transition">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </Link>

      {/* Editor shortcut */}
      <Link
        href="/admin/editor"
        className="flex items-center gap-3 mb-8 px-5 py-4 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition group"
      >
        <span className="text-2xl">✏️</span>
        <div className="flex-1">
          <div className="font-medium text-sm">Site Editor</div>
          <div className="text-xs text-zinc-400">Edit site content by voice or mouse · draft → publish workflow</div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-zinc-500 group-hover:text-white transition">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 p-5">
            <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">{s.label}</p>
            <p className="font-serif text-2xl text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white border border-stone-100">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-serif text-lg text-ink">Recent Orders</h2>
        </div>

        {orders.length === 0 ? (
          <p className="text-ink/40 text-sm p-6">No orders yet — they'll appear here after checkout.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs tracking-widest uppercase text-ink/40">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Total</th>
                  <th className="text-right px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50 transition">
                    <td className="px-6 py-3 text-ink">{order.User.name ?? order.User.email}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-sm ${
                        order.status === "paid"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-ink/40">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
