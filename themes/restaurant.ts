import type { ThemeConfig } from "@/lib/theme"

export const restaurantTheme: ThemeConfig = {
  id: "restaurant",
  brand:  { name: "Maison Dore Boutique Restaurant", tagline: "Where every table tells a story" },
  meta: {
    title:       "Maison Dore — Fine Dining & Private Events",
    description: "Seasonal French-Mediterranean cuisine in an intimate setting. Reserve your table.",
  },
  colors: {
    accent:      "#B45309",
    accentLight: "#D97706",
    accentDark:  "#78350F",
    background:  "#FFFBEB",
  },
  fonts: { heading: "var(--font-cormorant), 'Palatino Linotype', serif", headingVar: "--font-cormorant" },
  hero: {
    headline: "Every table tells a story.",
    subline:  "Seasonal French-Mediterranean cuisine crafted from local farms. Let me guide you through tonight's menu.",
    ctaText:  "Reserve a Table",
    image:    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80",
    imageAlt: "Elegant restaurant dining room with candlelight",
  },
  collections: [
    { name: "Starters",   slug: "Starters",   image: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800&q=80" },
    { name: "Mains",      slug: "Mains",      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80" },
    { name: "Desserts",   slug: "Desserts",   image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80" },
    { name: "Wine Pairings", slug: "Wine",    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80" },
    { name: "Private Events", slug: "Events", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80" },
  ],
  shipping: "Reservations recommended · Private dining available · Seasonal tasting menus",
  aria: {
    name:        "Elise",
    voice:       "Aoede",
    personality: "warm, knowledgeable, and gracious — like a maître d' who makes every guest feel like a regular",
    products:    "tuna-tartare ($24), foie-gras-torchon ($32), duck-confit ($48), sea-bass-en-papillote ($52), wagyu-beef-tenderloin ($78), chocolate-fondant ($18), tarte-tatin ($16), sommelier-pairing ($45)",
    categories:  "Starters, Mains, Desserts, Wine, Events",
  },
  products: [
    { name: "Tuna Tartare",         slug: "tuna-tartare",           description: "Hand-cut yellowfin tuna, avocado, citrus vinaigrette, crispy capers.",             price: 24.00, category: "Starters", image: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800&q=80", stockCount: 20 },
    { name: "Foie Gras Torchon",    slug: "foie-gras-torchon",     description: "House-cured duck foie gras, brioche toast, fig compote.",                          price: 32.00, category: "Starters", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80", stockCount: 12 },
    { name: "Duck Confit",          slug: "duck-confit",            description: "48-hour confit duck leg, Puy lentils, cherry jus, wilted endive.",                  price: 48.00, category: "Mains",    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", stockCount: 15 },
    { name: "Sea Bass en Papillote",slug: "sea-bass-en-papillote",  description: "Wild sea bass, fennel, olives, saffron nage — baked in parchment.",                price: 52.00, category: "Mains",    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80", stockCount: 10 },
    { name: "Wagyu Beef Tenderloin",slug: "wagyu-beef-tenderloin",  description: "Grade A5 Wagyu, truffle pomme purée, bone marrow jus.",                            price: 78.00, category: "Mains",    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80", stockCount: 8  },
    { name: "Chocolate Fondant",    slug: "chocolate-fondant",      description: "Valrhona dark chocolate with a molten centre, Tahitian vanilla ice cream.",        price: 18.00, category: "Desserts", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80", stockCount: 25 },
    { name: "Tarte Tatin",          slug: "tarte-tatin",            description: "Classic upside-down caramelised apple tart, crème fraîche.",                       price: 16.00, category: "Desserts", image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&q=80", stockCount: 20 },
    { name: "Sommelier Pairing",    slug: "sommelier-pairing",      description: "Four-glass wine pairing curated to match your full menu — ask Elise for details.", price: 45.00, category: "Wine",     image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80", stockCount: 30 },
  ],
  about: {
    story: "Maison Dore began as a small bistro in the Marais district and grew into a destination restaurant over fifteen years. Chef Aurelie Laurent trained under three Michelin-starred kitchens before returning to cook the food she actually wants to eat — seasonal, honest, and never without butter. Every dish changes with what arrives from the farm that morning.",
    values: [
      { title: "Farm-to-table",     desc: "We source from seven local farms within 80km. The menu is written after the delivery, not before." },
      { title: "No shortcuts",      desc: "Our stocks simmer for 18 hours. Sauces are finished à la minute. It takes time because it should." },
      { title: "Hospitality first", desc: "The best meal is the one where you never felt like a guest — just someone we were expecting." },
    ],
    team: [
      { name: "Chef Aurelie Laurent", role: "Executive Chef & Co-founder",  image: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=400&q=80" },
      { name: "Jean-Marc Dupont",     role: "Head Sommelier",               image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" },
      { name: "Clara Bonnet",         role: "Pastry Chef",                  image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80" },
    ],
  },
}
