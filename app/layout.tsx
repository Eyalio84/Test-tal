// All pages use DB (getActiveTheme) — opt out of static generation globally
export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { Playfair_Display, Inter, Lexend, Fredoka, Lora, Cormorant_Garamond } from "next/font/google"
import { Providers }           from "@/components/layout/Providers"
import { TopBar }              from "@/components/shell/TopBar"
import { BurgerDrawer }        from "@/components/shell/BurgerDrawer"
import { BottomTabBar }        from "@/components/shell/BottomTabBar"
import { Footer }              from "@/components/layout/Footer"
import { FloatingDock }        from "@/components/ui/FloatingDock"
import { AriaCommandDispatcher } from "@/components/aria/AriaCommandDispatcher"
import { ReportPad }            from "@/components/aria/ReportPad"
import { SkipLink }            from "@/components/ui/SkipLink"
import { LiveRegion }          from "@/components/ui/LiveRegion"
import { AccessibilityPanel }  from "@/components/ui/AccessibilityPanel"
import { ShippingBanner }      from "@/components/ui/ShippingBanner"
import { ThemeApplier }        from "@/components/layout/ThemeApplier"
import { ComponentPaletteDrawer }    from "@/components/editor/ComponentPaletteDrawer"
import { FloatingConfigPanel }       from "@/components/editor/FloatingConfigPanel"
import { getActiveTheme }      from "@/lib/getActiveTheme"
import { auth }                from "@/lib/auth"
import { env }                 from "@/env"
import "./globals.css"

// All theme fonts loaded once — CSS variable determines which is active
const playfair   = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const inter      = Inter({ subsets: ["latin"], variable: "--font-inter" })
const lexend     = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" })
const fredoka    = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" })
const lora       = Lora({ subsets: ["latin"], variable: "--font-lora" })
const cormorant  = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", weight: ["400","500","600"] })

// generateMetadata reads the active theme from DB so switching themes updates <title> without rebuild
export async function generateMetadata(): Promise<Metadata> {
  const theme = await getActiveTheme()
  return {
    title:       { template: `%s | ${theme.brand.name}`, default: theme.meta.title },
    description: theme.meta.description,
  }
}

const fontVars = [
  playfair.variable,
  inter.variable,
  lexend.variable,
  fredoka.variable,
  lora.variable,
  cormorant.variable,
].join(" ")

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getActiveTheme()
  return (
    <html lang="en" className={fontVars}>
      <head>
        <ThemeApplier />
      </head>
      <body>
        <Providers activeThemeId={theme.id}>
          <ShippingBanner />
          <SkipLink />
          <TopBar />
          <BurgerDrawer />
          <main id="main-content" className="pt-12 pb-14 lg:pb-0">{children}</main>
          <Footer />
          <BottomTabBar />
          <FloatingDock />
          <AriaCommandDispatcher />
          <ReportPad />
          <LiveRegion />
          <AccessibilityPanel />
          <ComponentPaletteDrawer />
          <FloatingConfigPanel />
        </Providers>
      </body>
    </html>
  )
}
