import type { ThemeConfig } from "@/lib/theme"

export const flowersTheme: ThemeConfig = {
  id: "flowers",
  brand:  { name: "Petal & Stem", tagline: "Flowers that say what words can't" },
  meta: {
    title:       "Petal & Stem — Fresh Flowers & Arrangements",
    description: "Hand-arranged fresh flowers, bouquets, and plants. Same-day delivery available.",
  },
  colors: {
    accent:      "#BE185D",
    accentLight: "#EC4899",
    accentDark:  "#9D174D",
    background:  "#FFF1F2",
  },
  fonts: { heading: "var(--font-cormorant), 'Palatino Linotype', serif", headingVar: "--font-cormorant" },
  hero: {
    headline: "Flowers that say what words can't.",
    subline:  "Hand-arranged, locally sourced, and delivered the same day.",
    ctaText:  "Send Flowers",
    image:    "https://images.unsplash.com/photo-1606041011872-596597976b25?w=1600&q=80",
    imageAlt: "Fresh flower bouquet arrangement",
  },
  collections: [
    { name: "Roses",      slug: "Roses",      image: "https://images.unsplash.com/photo-1502977249166-824b3a8a4d6d?w=800&q=80" },
    { name: "Bouquets",   slug: "Bouquets",   image: "https://images.unsplash.com/photo-1487530811015-780d3f83cdd7?w=800&q=80" },
    { name: "Seasonal",   slug: "Seasonal",   image: "https://images.unsplash.com/photo-1490750967868-88df5691cc0e?w=800&q=80" },
    { name: "Plants",     slug: "Plants",     image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&q=80" },
    { name: "Weddings",   slug: "Weddings",   image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80" },
  ],
  shipping: "Same-day delivery available · Fresh guarantee · Free delivery on orders over $60",
  aria: {
    name:        "Flora",
    voice:       "Kore",
    personality: "gentle, poetic, and warm — like a florist who sees the emotional meaning behind every flower choice",
    products:    "classic-rose-bouquet ($45), sunflower-arrangement ($38), mixed-wildflowers ($32), white-lily-bunch ($42), tulip-collection ($36), peony-bouquet ($65), lavender-bundle ($28), succulent-garden ($24)",
    categories:  "Roses, Bouquets, Seasonal, Plants, Weddings",
  },
  products: [
    { name: "Classic Rose Bouquet",       slug: "classic-rose-bouquet",       description: "12 long-stem red roses with eucalyptus and baby's breath.",                  price: 45.00, category: "Roses",    image: "https://images.unsplash.com/photo-1502977249166-824b3a8a4d6d?w=800&q=80", stockCount: 15 },
    { name: "Sunflower Arrangement",      slug: "sunflower-arrangement",      description: "Cheerful sunflower bouquet with goldenrod and greenery.",                    price: 38.00, category: "Bouquets", image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&q=80", stockCount: 10 },
    { name: "Mixed Wildflowers",          slug: "mixed-wildflowers",          description: "Seasonal wildflower mix — loose, natural, and effortlessly beautiful.",      price: 32.00, category: "Seasonal", image: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800&q=80", stockCount: 20 },
    { name: "White Lily Bunch",           slug: "white-lily-bunch",           description: "Six stems of fragrant white oriental lilies.",                               price: 42.00, category: "Bouquets", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80", stockCount: 8  },
    { name: "Tulip Collection",           slug: "tulip-collection",           description: "20 mixed tulips in spring colors. Seasonal availability.",                   price: 36.00, category: "Seasonal", image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800&q=80", stockCount: 12 },
    { name: "Peony Bouquet",              slug: "peony-bouquet",              description: "Lush peony bouquet — 8 stems, available in season.",                        price: 65.00, category: "Roses",    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80", stockCount: 5  },
    { name: "Lavender Bundle",            slug: "lavender-bundle",            description: "Dried lavender bundle, hand-tied. Lasts for months.",                        price: 28.00, category: "Plants",   image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&q=80", stockCount: 25 },
    { name: "Succulent Garden",           slug: "succulent-garden",           description: "Three assorted succulents in a terracotta tray.",                            price: 24.00, category: "Plants",   image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=800&q=80", stockCount: 18 },
  ],
  about: {
    story: "Petal & Stem started as a market stall and grew into the studio it is today — one flower arrangement at a time. Our founder, Isabelle, studied botanical design in Amsterdam before returning home to work with local growers. Every arrangement is made to order; we don't pre-arrange anything overnight. Fresh means fresh.",
    values: [
      { title: "Locally grown",       desc: "We source from within 100 miles whenever the season allows." },
      { title: "No filler flowers",   desc: "Every stem earns its place. No generic carnation padding." },
      { title: "Emotional intention", desc: "We ask what the occasion is, because flowers carry meaning." },
    ],
    team: [
      { name: "Isabelle Fontaine", role: "Founder & Lead Florist",  image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80" },
      { name: "Marco Silva",       role: "Grower Relations",        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
      { name: "Yuki Tanaka",       role: "Wedding Specialist",      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" },
    ],
  },
}
