"use client"

import { useEffect } from "react"
import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import { CartDrawer } from "@/components/ui/CartDrawer"
import { useAria } from "@/store/aria"
import { DevHub } from "@/components/dev/DevHub"

// Create one QueryClient per browser session — shared across all useQuery calls
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // consider data fresh for 60 seconds
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
  activeThemeId: string
}

export function Providers({ children, activeThemeId }: ProvidersProps) {
  const setActiveThemeId = useAria((s) => s.setActiveThemeId)
  useEffect(() => { setActiveThemeId(activeThemeId) }, [activeThemeId, setActiveThemeId])

  return (
    <QueryClientProvider client={queryClient}>
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
      {process.env.NODE_ENV === "development" && <DevHub />}
    </QueryClientProvider>
  )
}
