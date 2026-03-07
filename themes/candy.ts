import type { ThemeConfig } from "@/lib/theme"

export const candyTheme: ThemeConfig = {
  id: "candy",
  brand:  { name: "Sweet Drops", tagline: "Candy for every occasion" },
  meta: {
    title:       "Sweet Drops — Bulk Candy & Sweets",
    description: "Bulk candy, party favors, and gourmet sweets. Shop by color, flavor, or occasion.",
  },
  colors: {
    accent:      "#7C3AED",
    accentLight: "#A78BFA",
    accentDark:  "#5B21B6",
    background:  "#FDFBFF",
  },
  fonts: { heading: "var(--font-fredoka), 'Trebuchet MS', cursive", headingVar: "--font-fredoka" },
  hero: {
    headline: "Life's sweeter with us.",
    subline:  "Bulk candy, party favors, and nostalgic favorites — delivered.",
    ctaText:  "Shop Candy",
    image:    "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=1600&q=80",
    imageAlt: "Colorful candy assortment",
  },
  collections: [
    { name: "Gummies",    slug: "Gummies",    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80" },
    { name: "Chocolates", slug: "Chocolates", image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80" },
    { name: "Lollipops",  slug: "Lollipops",  image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&q=80" },
    { name: "Sour",       slug: "Sour",       image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80" },
    { name: "Seasonal",   slug: "Seasonal",   image: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80" },
  ],
  shipping: "Free shipping on orders over $35 · Freshness guaranteed · Same-day dispatch",
  aria: {
    name:        "Bubbles",
    voice:       "Puck",
    personality: "bubbly, fun, and enthusiastic — like someone who absolutely loves candy and wants everyone else to love it too",
    products:    "rainbow-twisty-pops ($7.75), red-candy-assortment ($24.99), gummy-bears-bulk ($12.99), chocolate-bark ($19.99), sour-worms-bag ($8.99), rock-candy-sticks ($6.99), jelly-bean-variety ($14.99), licorice-mix ($9.99)",
    categories:  "Gummies, Chocolates, Lollipops, Sour, Seasonal",
  },
  products: [
    { name: "Rainbow Twisty Pops",        slug: "rainbow-twisty-pops",        description: "Swirled rainbow lollipops, 12-piece bag. A party staple.",                  price: 7.75,  category: "Lollipops",  image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&q=80",  stockCount: 50 },
    { name: "Red Candy Assortment",        slug: "red-candy-assortment",       description: "All-red bulk candy table display set. Perfect for themed events.",          price: 24.99, category: "Seasonal",   image: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80",  stockCount: 20 },
    { name: "Gummy Bears Bulk Bag",        slug: "gummy-bears-bulk",           description: "5-pound bag of classic gummy bears, assorted flavors.",                     price: 12.99, category: "Gummies",    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80",  stockCount: 35 },
    { name: "Dark Chocolate Bark",         slug: "chocolate-bark",             description: "Handcrafted dark chocolate bark with sea salt and almonds.",                 price: 19.99, category: "Chocolates", image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80", stockCount: 18 },
    { name: "Sour Worms Bag",              slug: "sour-worms-bag",             description: "Extra-sour gummy worms, resealable 2-pound bag.",                           price: 8.99,  category: "Sour",       image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80",  stockCount: 40 },
    { name: "Rock Candy Sticks",           slug: "rock-candy-sticks",          description: "Crystal rock candy on sticks, assorted colors. Great for stirring cocktails.", price: 6.99, category: "Lollipops", image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&q=80", stockCount: 60 },
    { name: "Jelly Bean Variety",          slug: "jelly-bean-variety",         description: "50 flavors, 2 pounds. The classic crowd-pleaser.",                           price: 14.99, category: "Gummies",    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80",  stockCount: 25 },
    { name: "Black Licorice Mix",          slug: "licorice-mix",               description: "Assorted licorice shapes and sizes, 1.5-pound bag.",                         price: 9.99,  category: "Seasonal",   image: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80",  stockCount: 15 },
  ],
}
