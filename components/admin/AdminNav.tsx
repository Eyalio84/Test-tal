"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  { href: "/admin",        label: "Dashboard", icon: "◈" },
  { href: "/admin/themes", label: "Themes",    icon: "🎨" },
  { href: "/admin/editor", label: "Editor",    icon: "✏️" },
]

export function AdminNav() {
  const path = usePathname()

  return (
    <nav className="flex gap-1 mb-8 border-b border-stone-200 overflow-x-auto scrollbar-none">
      {NAV.map(({ href, label, icon }) => {
        const active = path === href
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex items-center gap-1.5 px-4 py-2.5 text-sm transition border-b-2 -mb-px whitespace-nowrap shrink-0",
              active
                ? "text-ink border-[var(--theme-accent)] font-medium"
                : "text-ink/50 border-transparent hover:text-ink hover:border-stone-300",
            ].join(" ")}
          >
            <span>{icon}</span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
