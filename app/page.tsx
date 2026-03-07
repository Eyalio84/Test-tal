import { Hero }        from "@/components/sections/Hero"
import { activeTheme } from "@/lib/theme"
import { prisma }      from "@/lib/db"
import { auth }        from "@/lib/auth"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>
}) {
  const { hero } = activeTheme
  const params   = await searchParams

  // Draft preview: only for the site owner with ?draft=1
  let useDraft = false
  if (params.draft === "1") {
    const session = await auth()
    useDraft = session?.user?.email === process.env.ADMIN_EMAIL
  }

  // Load editable content from SiteContent — fall back to theme defaults
  const rows = await prisma.siteContent.findMany({
    where: { id: { in: ["hero_headline", "hero_subline"] } },
  })
  const content: Record<string, string> = {}
  for (const row of rows) content[row.id] = useDraft ? row.draft : row.live

  return (
    <Hero
      headline={content.hero_headline || hero.headline}
      subline={content.hero_subline   || hero.subline}
      ctaText={hero.ctaText}
      ctaHref="/products"
      imageSrc={hero.image}
      imageAlt={hero.imageAlt}
    />
  )
}
