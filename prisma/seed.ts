import { PrismaClient } from "@prisma/client"

// theme resolution — works with THEME= or NEXT_PUBLIC_THEME= env var
const themeKey = (process.env.THEME ?? process.env.NEXT_PUBLIC_THEME ?? "jewelry").toLowerCase()

// dynamic import so only one theme file is loaded
async function loadTheme() {
  switch (themeKey) {
    case "candy":   return (await import("../themes/candy")).candyTheme
    case "bakery":  return (await import("../themes/bakery")).bakeryTheme
    case "flowers": return (await import("../themes/flowers")).flowersTheme
    case "wine":    return (await import("../themes/wine")).wineTheme
    default:        return (await import("../themes/jewelry")).jewelryTheme
  }
}

const prisma = new PrismaClient()

async function main() {
  const theme = await loadTheme()
  console.log(`Seeding theme: ${theme.id}`)

  // Clear existing products for clean re-seed
  await prisma.product.deleteMany()

  console.log("Seeding products...")
  for (const p of theme.products) {
    await prisma.product.create({
      data: {
        name:        p.name,
        slug:        p.slug,
        description: p.description,
        price:       p.price,
        category:    p.category,
        images:      JSON.stringify([p.image]),
        inStock:     p.inStock ?? true,
        stockCount:  p.stockCount ?? null,
      },
    })
    console.log(`  ✓ ${p.name}`)
  }

  console.log("Seeding site content...")
  const siteContent = [
    { id: "hero_headline", draft: theme.hero.headline,                              live: theme.hero.headline },
    { id: "hero_subline",  draft: theme.hero.subline,                               live: theme.hero.subline },
    { id: "about_body",    draft: `${theme.brand.name} — ${theme.brand.tagline}.`,  live: `${theme.brand.name} — ${theme.brand.tagline}.` },
  ]
  for (const content of siteContent) {
    await prisma.siteContent.upsert({
      where:  { id: content.id },
      update: { draft: content.draft, live: content.live },
      create: content,
    })
    console.log(`  ✓ ${content.id}`)
  }

  console.log("Done.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
