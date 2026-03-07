import type { ThemeConfig } from "@/lib/theme"

export const bakeryTheme: ThemeConfig = {
  id: "bakery",
  brand:  { name: "The Flour Studio", tagline: "Baked with love, every morning" },
  meta: {
    title:       "The Flour Studio — Artisan Bakery",
    description: "Fresh artisan bread, pastries, and cakes baked daily. Order online for same-day pickup.",
  },
  colors: {
    accent:      "#92400E",
    accentLight: "#B45309",
    accentDark:  "#78350F",
    background:  "#FEFCE8",
  },
  fonts: { heading: "var(--font-lora), Georgia, serif", headingVar: "--font-lora" },
  hero: {
    headline: "Baked with love, every morning.",
    subline:  "Sourdough, croissants, and pastries — made by hand, fresh daily.",
    ctaText:  "Order Now",
    image:    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80",
    imageAlt: "Fresh artisan bread and pastries",
  },
  collections: [
    { name: "Breads",     slug: "Breads",     image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80" },
    { name: "Croissants", slug: "Croissants", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80" },
    { name: "Cakes",      slug: "Cakes",      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80" },
    { name: "Pastries",   slug: "Pastries",   image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&q=80" },
    { name: "Seasonal",   slug: "Seasonal",   image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80" },
  ],
  shipping: "Same-day pickup available · Fresh baked daily · Order by 10am",
  aria: {
    name:        "Sage",
    voice:       "Charon",
    personality: "warm, nurturing, and knowledgeable about all things baked — like a baker who genuinely loves sharing the craft",
    products:    "sourdough-boule ($8.50), croissant-box-6 ($14.99), cinnamon-babka ($16.99), chocolate-eclair-4pack ($18.99), almond-croissant ($5.99), pain-au-chocolat ($13.99), kouign-amann ($9.99), seasonal-tart ($12.99)",
    categories:  "Breads, Croissants, Cakes, Pastries, Seasonal",
  },
  products: [
    { name: "Sourdough Boule",            slug: "sourdough-boule",            description: "Classic 24-hour fermented sourdough. Crispy crust, open crumb.",             price: 8.50,  category: "Breads",     image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80", stockCount: 12 },
    { name: "Croissant Box (6)",          slug: "croissant-box-6",            description: "Six buttery, laminated croissants. Baked fresh each morning.",                price: 14.99, category: "Croissants", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80", stockCount: 8  },
    { name: "Cinnamon Babka",             slug: "cinnamon-babka",             description: "Swirled cinnamon babka on a brioche base. Serves 8.",                         price: 16.99, category: "Cakes",      image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80", stockCount: 5  },
    { name: "Chocolate Éclairs (4)",      slug: "chocolate-eclair-4pack",     description: "Four classic éclairs with vanilla cream and dark chocolate glaze.",           price: 18.99, category: "Pastries",   image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&q=80", stockCount: 6  },
    { name: "Almond Croissant",           slug: "almond-croissant",           description: "Twice-baked croissant filled with frangipane, topped with flaked almonds.",   price: 5.99,  category: "Croissants", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80", stockCount: 10 },
    { name: "Pain au Chocolat (4)",       slug: "pain-au-chocolat",           description: "Four chocolate croissants with two dark chocolate batons each.",              price: 13.99, category: "Croissants", image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&q=80", stockCount: 8  },
    { name: "Kouign-Amann",              slug: "kouign-amann",               description: "Breton butter cake with caramelized sugar crust. Dangerously good.",          price: 9.99,  category: "Pastries",   image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80", stockCount: 4  },
    { name: "Seasonal Fruit Tart",        slug: "seasonal-tart",              description: "Crisp pastry shell, vanilla cream, topped with whatever's best today.",      price: 12.99, category: "Seasonal",   image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80", stockCount: 7  },
  ],
}
