import type { ThemeConfig } from "@/lib/theme"

export const jewelryTheme: ThemeConfig = {
  id: "jewelry",
  brand:  { name: "Store", tagline: "Handcrafted with intention" },
  meta: {
    title:       "Store — Handcrafted Jewelry",
    description: "Handcrafted jewelry with intention. Discover our collections.",
  },
  colors: {
    accent:      "#c9a96e",
    accentLight: "#e0c080",
    accentDark:  "#a07840",
    background:  "#fafaf8",
  },
  fonts: { heading: "var(--font-playfair), Georgia, serif", headingVar: "--font-playfair" },
  hero: {
    headline: "Handcrafted with intention.",
    subline:  "Each piece tells a story.",
    ctaText:  "Shop Now",
    image:    "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1600&q=80",
    imageAlt: "Featured jewelry collection",
  },
  collections: [
    { name: "Rings",     slug: "Rings",     image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80" },
    { name: "Necklaces", slug: "Necklaces", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80" },
    { name: "Earrings",  slug: "Earrings",  image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80" },
    { name: "Bracelets", slug: "Bracelets", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80" },
    { name: "Pendants",  slug: "Pendants",  image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80" },
  ],
  shipping: "Free shipping on orders over $75 · 30-day returns · SSL secured",
  aria: {
    name:        "Aria",
    voice:       "Aoede",
    personality: "sophisticated, warm, knowledgeable — like a trusted friend who knows everything about fine jewelry",
    products:    "gold-bracelet-set ($89), pearl-drop-earrings ($65), sapphire-statement-ring ($245), diamond-solitaire-pendant ($185), rose-gold-chain-necklace ($125), emerald-stud-earrings ($145), vintage-gold-brooch ($75), sterling-silver-cuff ($55)",
    categories:  "Rings, Necklaces, Earrings, Bracelets, Pendants, Brooches",
  },
  products: [
    { name: "Gold Bracelet Set",          slug: "gold-bracelet-set",          description: "Delicate 18k gold-plated bangles, set of three. Perfect for stacking.",      price: 89,  category: "Bracelets", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80", stockCount: 12 },
    { name: "Pearl Drop Earrings",        slug: "pearl-drop-earrings",        description: "Classic freshwater pearl drops on gold vermeil hooks. Timeless elegance.",   price: 65,  category: "Earrings",  image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80", stockCount: 8  },
    { name: "Sapphire Statement Ring",    slug: "sapphire-statement-ring",    description: "Oval sapphire set in sterling silver with diamond accents.",                  price: 245, category: "Rings",     image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80", stockCount: 3  },
    { name: "Diamond Solitaire Pendant",  slug: "diamond-solitaire-pendant",  description: "0.25ct diamond solitaire on an 18-inch gold chain.",                         price: 185, category: "Pendants",  image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80", stockCount: 6  },
    { name: "Rose Gold Chain Necklace",   slug: "rose-gold-chain-necklace",   description: "Delicate rope-style chain in 14k rose gold. Wear alone or layered.",         price: 125, category: "Necklaces", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80", stockCount: 15 },
    { name: "Emerald Stud Earrings",      slug: "emerald-stud-earrings",      description: "Natural emerald studs in 18k gold settings.",                                price: 145, category: "Earrings",  image: "https://images.unsplash.com/photo-1573408301185-9519df3dfd40?w=800&q=80", stockCount: 5  },
    { name: "Vintage Gold Brooch",        slug: "vintage-gold-brooch",        description: "Art Deco inspired brooch with intricate filigree work in gold.",              price: 75,  category: "Brooches",  image: "https://images.unsplash.com/photo-1588444837495-c6d6571a1820?w=800&q=80", stockCount: 4  },
    { name: "Sterling Silver Cuff",       slug: "sterling-silver-cuff",       description: "Wide sterling silver cuff with hammered finish.",                             price: 55,  category: "Bracelets", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80", stockCount: 20 },
  ],
}
