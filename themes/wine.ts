import type { ThemeConfig } from "@/lib/theme"

export const wineTheme: ThemeConfig = {
  id: "wine",
  brand:  { name: "The Cellar", tagline: "Wine worth remembering" },
  meta: {
    title:       "The Cellar — Fine Wine & Spirits",
    description: "Curated fine wines, champagnes, and spirits. Expert recommendations by voice.",
  },
  colors: {
    accent:      "#881337",
    accentLight: "#9F1239",
    accentDark:  "#4C0519",
    background:  "#FFF7ED",
  },
  fonts: { heading: "var(--font-cormorant), 'Palatino Linotype', serif", headingVar: "--font-cormorant" },
  hero: {
    headline: "Wine worth remembering.",
    subline:  "Curated bottles from the world's finest regions. Ask me what pairs with tonight's dinner.",
    ctaText:  "Explore the Cellar",
    image:    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&q=80",
    imageAlt: "Fine wine bottles in a cellar",
  },
  collections: [
    { name: "Red Wine",    slug: "Red",       image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80" },
    { name: "White Wine",  slug: "White",     image: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80" },
    { name: "Champagne",   slug: "Champagne", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" },
    { name: "Spirits",     slug: "Spirits",   image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&q=80" },
    { name: "Gift Sets",   slug: "Gift Sets", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80" },
  ],
  shipping: "Free shipping on orders over $100 · Temperature-controlled delivery · Expert curation",
  aria: {
    name:        "Cellar",
    voice:       "Fenrir",
    personality: "sophisticated, knowledgeable, and refined — like a sommelier who makes you feel instantly at ease",
    products:    "cabernet-sauvignon-reserve ($48), champagne-brut ($38), pinot-noir-estate ($42), chardonnay-barrel ($35), prosecco-collection ($29), whiskey-single-malt ($95), rose-provence ($32), gin-botanical ($55)",
    categories:  "Red, White, Champagne, Spirits, Gift Sets",
  },
  products: [
    { name: "Cabernet Sauvignon Reserve", slug: "cabernet-sauvignon-reserve", description: "Full-bodied Napa Valley Cab. Dark fruit, cedar, and a long finish.",          price: 48.00, category: "Red",       image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80", stockCount: 24 },
    { name: "Champagne Brut NV",          slug: "champagne-brut",             description: "Non-vintage Champagne from a small grower. Fine bubbles, brioche notes.",     price: 38.00, category: "Champagne", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", stockCount: 18 },
    { name: "Pinot Noir Estate",          slug: "pinot-noir-estate",          description: "Burgundy-style Pinot from Oregon's Willamette Valley. Silky and earthy.",      price: 42.00, category: "Red",       image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80", stockCount: 15 },
    { name: "Chardonnay Barrel Select",   slug: "chardonnay-barrel",          description: "Lightly oaked California Chardonnay. Stone fruit, vanilla, crisp finish.",    price: 35.00, category: "White",     image: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80", stockCount: 20 },
    { name: "Prosecco Collection",        slug: "prosecco-collection",        description: "Three bottles of DOC Prosecco Extra Dry. Perfect for any occasion.",           price: 29.00, category: "Champagne", image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&q=80", stockCount: 30 },
    { name: "Single Malt Whisky 12yr",    slug: "whiskey-single-malt",        description: "Highland single malt aged 12 years. Honey, dried fruit, gentle smoke.",       price: 95.00, category: "Spirits",   image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&q=80", stockCount: 6  },
    { name: "Rosé de Provence",           slug: "rose-provence",              description: "Classic pale Provençal rosé. Delicate, dry, and endlessly drinkable.",         price: 32.00, category: "White",     image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80", stockCount: 22 },
    { name: "Botanical Gin",              slug: "gin-botanical",              description: "Small-batch gin with 11 botanicals including lavender and cardamom.",           price: 55.00, category: "Spirits",   image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80", stockCount: 14 },
  ],
  about: {
    story: "The Cellar was founded by a sommelier who grew tired of wine being made intimidating. Our philosophy is simple: the best bottle is the one you actually enjoy drinking. We travel to small estates that don't advertise, taste everything ourselves, and bring back only what we'd serve at our own table. No fluff. Just wine worth opening.",
    values: [
      { title: "Small producers",    desc: "We work with estates under 10,000 cases per year. The good stuff is never mass-produced." },
      { title: "Honest curation",    desc: "We taste every bottle before listing it. Our recommendation is our reputation." },
      { title: "Education always",   desc: "You'll never feel judged for asking what pairs with pizza. That's why we're here." },
    ],
    team: [
      { name: "Victor Moreau",  role: "Founder & Head Sommelier",  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" },
      { name: "Laila Hassan",   role: "Buyer, Europe & Americas",  image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80" },
      { name: "Ben Nakamura",   role: "Customer Wine Advisor",     image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80" },
    ],
  },
}
