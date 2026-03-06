import type { Metadata } from "next"
import { Playfair_Display, Inter, Lexend } from "next/font/google"
import { Providers } from "@/components/layout/Providers"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { FloatingDock } from "@/components/ui/FloatingDock"
import { AriaCommandDispatcher } from "@/components/aria/AriaCommandDispatcher"
import { AriaTourOverlay } from "@/components/aria/AriaTourOverlay"
import { SkipLink } from "@/components/ui/SkipLink"
import { LiveRegion } from "@/components/ui/LiveRegion"
import { AccessibilityPanel } from "@/components/ui/AccessibilityPanel"
import { ShippingBanner } from "@/components/ui/ShippingBanner"
import "./globals.css"

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const inter    = Inter({ subsets: ["latin"], variable: "--font-inter" })
const lexend   = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" })

export const metadata: Metadata = {
  title: { template: "%s | Store", default: "Store — Handcrafted Jewelry" },
  description: "Handcrafted jewelry with intention. Discover our collections.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${lexend.variable}`}>
      <body>
        <Providers>
          <ShippingBanner />
          <SkipLink />
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
          <FloatingDock />
          <AriaCommandDispatcher />
          <AriaTourOverlay />
          <LiveRegion />
          <AccessibilityPanel />
        </Providers>
      </body>
    </html>
  )
}
