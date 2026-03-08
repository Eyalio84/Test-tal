"use client"

import { useEffect } from "react"
import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "react-hot-toast"
import { CartDrawer } from "@/components/ui/CartDrawer"
import { useAria } from "@/store/aria"

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
      {/* Dev-only query inspector — disappears in production builds */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
