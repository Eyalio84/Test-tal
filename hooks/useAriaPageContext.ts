"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAria } from "@/store/aria"
import { sendPageContextToAria } from "@/hooks/useAriaLive"

// Infer Aria context + themeId from current URL path
function inferContext(pathname: string): {
  context: "platform" | "template" | "member"
  themeId?: string
} {
  const templateMatch = pathname.match(/^\/templates\/([^/]+)/)
  if (templateMatch) return { context: "template", themeId: templateMatch[1] }

  if (pathname === "/" || pathname === "/templates" || pathname.startsWith("/pricing")) {
    return { context: "platform" }
  }

  // /dashboard, /admin, /products, /collections, /about, /wishlist, etc.
  return { context: "member" }
}

// Mount in a client component (FloatingDock) to auto-sync Aria context with navigation
export function useAriaPageContext() {
  const pathname = usePathname()
  const { setAriaContext, setCurrentPage, setActiveThemeId, isConnected } = useAria()

  useEffect(() => {
    const { context, themeId } = inferContext(pathname)

    setCurrentPage(pathname)
    setAriaContext(context)
    if (themeId) setActiveThemeId(themeId)

    // If Aria is live, inject page context into the session (no spoken response)
    if (isConnected) sendPageContextToAria(pathname)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
}
