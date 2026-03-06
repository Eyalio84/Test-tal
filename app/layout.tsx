import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import { Providers } from "@/components/layout/Providers"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { WhatsAppButton } from "@/components/ui/WhatsAppButton"
import { SkipLink } from "@/components/ui/SkipLink"
import { LiveRegion } from "@/components/ui/LiveRegion"
import "./globals.css"

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: { template: "%s | Store", default: "Store — Handcrafted Jewelry" },
  description: "Handcrafted jewelry with intention. Discover our collections.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <Providers>
          <SkipLink />
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
          <WhatsAppButton />
          <LiveRegion />
        </Providers>
      </body>
    </html>
  )
}
