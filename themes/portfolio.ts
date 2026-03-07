import type { ThemeConfig } from "@/lib/theme"

export const portfolioTheme: ThemeConfig = {
  id: "portfolio",
  brand:  { name: "Studio Noir", tagline: "Visual stories worth telling" },
  meta: {
    title:       "Studio Noir — Photography & Visual Direction",
    description: "Award-winning commercial photography, editorial direction, and fine-art prints.",
  },
  colors: {
    accent:      "#18181B",
    accentLight: "#3F3F46",
    accentDark:  "#09090B",
    background:  "#FAFAFA",
  },
  fonts: { heading: "var(--font-playfair), Georgia, serif", headingVar: "--font-playfair" },
  hero: {
    headline: "Visual stories worth telling.",
    subline:  "Commercial photography, editorial direction, and fine-art prints. Ask me about the work.",
    ctaText:  "View Portfolio",
    image:    "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1600&q=80",
    imageAlt: "Studio photography setup with dramatic lighting",
  },
  collections: [
    { name: "Commercial",  slug: "Commercial",  image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&q=80" },
    { name: "Editorial",   slug: "Editorial",   image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" },
    { name: "Fine Art",    slug: "Fine Art",    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80" },
    { name: "Architecture",slug: "Architecture",image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80" },
    { name: "Portraits",   slug: "Portraits",   image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80" },
  ],
  shipping: "Limited edition prints available · Commercial licensing · Global delivery",
  aria: {
    name:        "Noir",
    voice:       "Charon",
    personality: "measured, precise, and quietly passionate — like a photographer who lets the work speak but can talk about process all day",
    products:    "cityscape-series-print ($350), portrait-study-i ($280), architectural-dusk ($420), editorial-collection-i ($195), commercial-license-standard ($1200), fine-art-canvas-xl ($650), behind-the-lens-workshop ($480), studio-day-rate ($1800)",
    categories:  "Commercial, Editorial, Fine Art, Architecture, Portraits",
  },
  products: [
    { name: "Cityscape Series #7",       slug: "cityscape-series-print",       description: "New York at blue hour. Archival pigment print, edition of 25. 60×90cm.",          price: 350.00,  category: "Fine Art",    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80", stockCount: 18 },
    { name: "Portrait Study I",          slug: "portrait-study-i",             description: "Studio portrait series. Archival print, edition of 15. 50×70cm.",                  price: 280.00,  category: "Portraits",   image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80", stockCount: 11 },
    { name: "Architectural Dusk",        slug: "architectural-dusk",           description: "Glass facade at golden hour. Large format archival print, edition of 10. 80×120cm.",price: 420.00,  category: "Architecture",image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80", stockCount: 7  },
    { name: "Editorial Collection I",    slug: "editorial-collection-i",       description: "Six-print editorial series from the Paris fashion week shoot. Unframed.",           price: 195.00,  category: "Editorial",   image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&q=80", stockCount: 20 },
    { name: "Commercial License (Std)",  slug: "commercial-license-standard",  description: "Standard commercial usage license for a single image. 2-year term, global.",      price: 1200.00, category: "Commercial",  image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80", stockCount: 99 },
    { name: "Fine Art Canvas XL",        slug: "fine-art-canvas-xl",           description: "Gallery-wrap canvas print, 100×150cm. Ready to hang, artist signed.",              price: 650.00,  category: "Fine Art",    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80", stockCount: 5  },
    { name: "Behind the Lens Workshop",  slug: "behind-the-lens-workshop",     description: "Half-day studio workshop — lighting, composition, post-processing. Max 4 people.",  price: 480.00,  category: "Commercial",  image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&q=80", stockCount: 4  },
    { name: "Studio Day Rate",           slug: "studio-day-rate",              description: "Full studio hire including lighting rigs, 2 backdrops, and basic equipment.",       price: 1800.00, category: "Commercial",  image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80", stockCount: 10 },
  ],
  about: {
    story: "Studio Noir started in a converted warehouse with two speedlights and a borrowed camera. Fifteen years later the studio has shot for Dior, Monocle, and the Tate Modern — but the approach hasn't changed: available light when possible, minimal retouching, and subjects who look like themselves. The archive contains over 300,000 frames. About 40 of them are worth hanging on a wall.",
    values: [
      { title: "Light as material",  desc: "Every decision about when and where to shoot comes down to light. We never fight it; we wait for it." },
      { title: "Minimum retouching", desc: "We remove what shouldn't be there. We never change what should." },
      { title: "Long relationships", desc: "Our longest client relationship is 11 years. We prefer to know the brand before we shoot it." },
    ],
    team: [
      { name: "Marcus Holt",      role: "Founder & Lead Photographer", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80" },
      { name: "Sana Ohashi",      role: "Art Director",                image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" },
      { name: "Tom Redfield",     role: "Digital Technician",          image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
    ],
  },
}
