import type { Metadata } from "next"
import { prisma } from "@/lib/db"

export const metadata: Metadata = { title: "Admin" }

export default async function AdminPage() {
  const [orders, productCount, revenueAgg] = await Promise.all([
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
