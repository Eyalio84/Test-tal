"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"
import { CartDrawer } from "@/components/ui/CartDrawer"

export function Providers({ children }: { children: React.ReactNode }) {
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
