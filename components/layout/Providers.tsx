"use client"

import { useEffect } from "react"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"
import { CartDrawer } from "@/components/ui/CartDrawer"
import { useAria } from "@/store/aria"

interface ProvidersProps {
  children: React.ReactNode
  activeThemeId: string
}

export function Providers({ children, activeThemeId }: ProvidersProps) {
  // Hydrate Zustand with the server-resolved theme so Aria's config stays in sync
  const setActiveThemeId = useAria((s) => s.setActiveThemeId)
  useEffect(() => { setActiveThemeId(activeThemeId) }, [activeThemeId, setActiveThemeId])

  return (
    <SessionProvider>
      {children}
      <CartDrawer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-inter)",
            fontSize: "13px",
          },
        }}
      />
    </SessionProvider>
  )
}
