"use client"

import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useShell, type ShellTab } from "@/store/shell"
import { useAria } from "@/store/aria"
import { useAriaLive } from "@/hooks/useAriaLive"

// ── Tab icons (inline SVG, ~24x24) ────────────────────────────────────────
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}
function PagesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}
function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
    </svg>
  )
}
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
  )
}
function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

// ── Tab definition ─────────────────────────────────────────────────────────
interface TabDef {
  id: ShellTab
  label: string
  icon: React.ReactNode
}

const TABS: TabDef[] = [
  { id: "home",      label: "Home",      icon: <HomeIcon /> },
  { id: "pages",     label: "Pages",     icon: <PagesIcon /> },
  { id: "aria",      label: "Aria",      icon: <SparkleIcon /> },
  { id: "dashboard", label: "Dashboard", icon: <GridIcon /> },
  { id: "manage",    label: "Manage",    icon: <MenuIcon /> },
]

const TAB_ROUTES: Record<string, string> = {
  home: "/",
  pages: "/pages",
  dashboard: "/dashboard",
}

// ── BottomTabBar ───────────────────────────────────────────────────────────
export function BottomTabBar() {
  const { data: session } = useSession()
  const activeTab = useShell((s) => s.activeTab)
  const setActiveTab = useShell((s) => s.setActiveTab)
  const toggleDrawer = useShell((s) => s.toggleDrawer)
  const { isConnected } = useAria()
  const { connect, disconnect } = useAriaLive()
  const router = useRouter()
  const pathname = usePathname()

  // Sync active tab with current route
  useEffect(() => {
    if (pathname === "/") setActiveTab("home")
    else if (pathname.startsWith("/pages")) setActiveTab("pages")
    else if (pathname.startsWith("/dashboard")) setActiveTab("dashboard")
  }, [pathname, setActiveTab])

  // Only show for authenticated owners
  if (!session?.user) return null

  function handleTab(tab: ShellTab) {
    if (tab === "aria") {
      if (isConnected) disconnect()
      else connect()
      setActiveTab(tab)
      return
    }
    if (tab === "manage") {
      toggleDrawer()
      return
    }
    setActiveTab(tab)
    const route = TAB_ROUTES[tab]
    if (route) router.push(route)
  }

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-stone-200 lg:hidden"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          const isAria = tab.id === "aria"

          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
              }`}
              style={isActive ? { color: "var(--theme-accent, #c9a96e)" } : undefined}
            >
              {tab.icon}
              <span className="text-[10px] tracking-wide">{tab.label}</span>

              {/* Aria connection indicator */}
              {isAria && isConnected && (
                <span className="absolute top-1.5 right-1/2 translate-x-3.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
