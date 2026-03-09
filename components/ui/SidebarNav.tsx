"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/cn"

export interface NavItem {
  href: string
  label: string
  icon?: React.ReactNode
  active?: boolean
}

export interface SidebarNavProps {
  items: NavItem[]
  collapsible?: boolean
  className?: string
  onNavigate?: (href: string) => void
}

export function SidebarNav({
  items,
  collapsible = true,
  className,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <nav className={cn("border-r border-stone-200", className)}>
      {collapsible && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 w-full hover:bg-stone-50 transition"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      )}

      <ul className="space-y-1 p-2">
        {items.map((item) => {
          const isActive = item.active ?? pathname === item.href

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => onNavigate?.(item.href)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded text-sm transition",
                  isActive
                    ? "bg-ink text-white font-medium"
                    : "text-ink/70 hover:bg-stone-100 hover:text-ink"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon && (
                  <span className="h-5 w-5 flex-shrink-0">{item.icon}</span>
                )}
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
