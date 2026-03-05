import { Hero } from "@/components/sections/Hero"

export default function HomePage() {
  return (
    <Hero
      headline="Handcrafted with intention."
      subline="Each piece tells a story."
      ctaText="Shop Now"
      ctaHref="/products"
      imageSrc="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1600&q=80"
      imageAlt="Featured jewelry collection"
    />
  )
}
