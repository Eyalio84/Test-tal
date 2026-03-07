import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/api/auth/signin?callbackUrl=/admin")
  if (session.user?.email !== process.env.ADMIN_EMAIL) redirect("/")

  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl text-ink">Admin Dashboard</h1>
            <span className="inline-block px-2 py-0.5 text-xs font-medium tracking-wide bg-amber-100 text-amber-800 rounded-sm border border-amber-200">
              Super Admin
            </span>
          </div>
          <span className="text-xs text-ink/40 tracking-wide">{session.user?.email}</span>
        </div>
        {children}
      </div>
    </div>
  )
}
