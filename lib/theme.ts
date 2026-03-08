export interface ThemeProduct {
  name: string
  slug: string
  description: string
  price: number
  category: string
  image: string
  inStock?: boolean
  stockCount?: number
}

export interface ThemeConfig {
  id: string
  brand: {
    name:    string
    tagline: string
  }
  meta: {
    title:       string   // page title template default
    description: string
  }
  colors: {
    accent:     string   // primary brand color  e.g. #c9a96e
    accentLight: string  // lighter variant      e.g. #e0c080
    accentDark:  string  // darker variant       e.g. #a07840
    background:  string  // page bg              e.g. #fafaf8
  }
  fonts: {
    heading: string      // CSS font-family value for headings
    headingVar: string   // next/font CSS variable name e.g. --font-playfair
  }
  hero: {
    headline: string
    subline:  string
    ctaText:  string
    image:    string
    imageAlt: string
  }
  collections: Array<{
    name:  string
    slug:  string        // category query param value
    image: string
  }>
  shipping: string       // shipping banner text
  aria: {
    name:        string  // voice assistant name
    voice:       string  // Gemini Live voice ID
    personality: string  // system prompt personality description
    products:    string  // product list for system prompt
    categories:  string  // categories for system prompt
  }
  products: ThemeProduct[]
  about: {
    story:  string
    values: Array<{ title: string; desc: string }>
    team:   Array<{ name: string; role: string; image?: string }>
  }
}

// ── Theme registry ─────────────────────────────────────────────────────────
import { jewelryTheme }    from "@/themes/jewelry"
import { candyTheme }      from "@/themes/candy"
import { bakeryTheme }     from "@/themes/bakery"
import { flowersTheme }    from "@/themes/flowers"
import { wineTheme }       from "@/themes/wine"
import { restaurantTheme } from "@/themes/restaurant"
import { portfolioTheme }  from "@/themes/portfolio"
import { saasTheme }       from "@/themes/saas"

export const THEMES: Record<string, ThemeConfig> = {
  jewelry:    jewelryTheme,
  candy:      candyTheme,
  bakery:     bakeryTheme,
  flowers:    flowersTheme,
  wine:       wineTheme,
  restaurant: restaurantTheme,
  portfolio:  portfolioTheme,
  saas:       saasTheme,
}

export const THEME_IDS = Object.keys(THEMES) as (keyof typeof THEMES)[]

const key = (process.env.NEXT_PUBLIC_THEME ?? "jewelry").toLowerCase()
export const activeTheme: ThemeConfig = THEMES[key] ?? jewelryTheme

// ── Dev-only: warn on duplicate product images within a theme ───────────────
if (process.env.NODE_ENV === "development") {
  for (const theme of Object.values(THEMES)) {
    const seen = new Set<string>()
    for (const product of theme.products) {
      if (seen.has(product.image)) {
        console.warn(
          `[theme:${theme.id}] Duplicate product image URL on "${product.name}": ${product.image}`
        )
      }
      seen.add(product.image)
    }
  }
}
