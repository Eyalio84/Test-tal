import { Hero }        from "@/components/sections/Hero"
import { activeTheme } from "@/lib/theme"

export default function HomePage() {
  const { hero } = activeTheme
  return (
    <Hero
      headline={hero.headline}
      subline={hero.subline}
      ctaText={hero.ctaText}
      ctaHref="/products"
      imageSrc={hero.image}
      imageAlt={hero.imageAlt}
    />
  )
}
