import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const products = [
  {
    name: "Gold Bracelet Set",
    slug: "gold-bracelet-set",
    description: "Delicate 18k gold-plated bangles, sold as a set of three. Perfect for stacking.",
    price: 89,
    category: "Bracelets",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1573408301185-9519f94e1505?w=800&q=80",
    ]),
  },
  {
    name: "Pearl Drop Earrings",
    slug: "pearl-drop-earrings",
    description: "Classic freshwater pearl drops on gold vermeil hooks. Timeless elegance.",
    price: 65,
    category: "Earrings",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
    ]),
  },
  {
    name: "Sapphire Statement Ring",
    slug: "sapphire-statement-ring",
    description: "Deep blue lab sapphire set in sterling silver. Bold and sophisticated.",
    price: 245,
    category: "Rings",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
    ]),
  },
  {
    name: "Diamond Solitaire Pendant",
    slug: "diamond-solitaire-pendant",
    description: "0.25ct diamond solitaire on a fine 16\" gold chain. A forever piece.",
    price: 185,
    category: "Pendants",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
    ]),
  },
  {
    name: "Rose Gold Chain Necklace",
    slug: "rose-gold-chain-necklace",
    description: "Elegant 18\" rose gold chain with a delicate twisted link design.",
    price: 125,
    category: "Necklaces",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
    ]),
  },
  {
    name: "Emerald Stud Earrings",
    slug: "emerald-stud-earrings",
    description: "Vibrant lab emerald studs in a classic four-prong gold setting.",
    price: 145,
    category: "Earrings",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80",
    ]),
  },
  {
    name: "Vintage Gold Brooch",
    slug: "vintage-gold-brooch",
    description: "Art-deco inspired leaf brooch in antique gold finish. A collector's piece.",
    price: 75,
    category: "Brooches",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1573408301185-9519f94e1505?w=800&q=80",
    ]),
  },
  {
    name: "Sterling Silver Cuff",
    slug: "sterling-silver-cuff",
    description: "Hammered sterling silver open cuff. Adjustable for a perfect fit.",
    price: 55,
    category: "Bracelets",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1576022162028-b9c1f12e95a0?w=800&q=80",
    ]),
  },
]

const siteContent = [
  {
    id: "hero_headline",
    value: "Handcrafted with Intention",
  },
  {
    id: "hero_subline",
    value: "Jewelry that tells your story. Each piece made with care, designed to last.",
  },
  {
    id: "about_body",
    value:
      "We believe jewelry is more than adornment — it's memory made tangible. Founded in 2018, we partner with artisan craftspeople to create pieces that carry meaning and withstand time. Every stone is ethically sourced. Every setting is hand-finished. Every piece is made to become yours.",
  },
]

async function main() {
  console.log("Seeding products...")
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    })
    console.log(`  ✓ ${product.name}`)
  }

  console.log("Seeding site content...")
  for (const content of siteContent) {
    await prisma.siteContent.upsert({
      where: { id: content.id },
      update: { value: content.value },
      create: content,
    })
    console.log(`  ✓ ${content.id}`)
  }

  console.log("Done.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
