import "dotenv/config"
import { prisma } from "@/lib/db"
import { COMPONENT_REGISTRY } from "@/lib/componentRegistry"

async function seedComponents() {
  try {
    console.log("🌱 Seeding components...")

    // Check if components already seeded
    const existingCount = await prisma.component.count()
    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} components already exist. Skipping seed.`)
      return
    }

    // Seed all components
    const created = await Promise.all(
      COMPONENT_REGISTRY.map((comp) =>
        prisma.component.create({
          data: {
            slug: comp.slug,
            name: comp.name,
            category: comp.category,
            description: comp.description,
            ariaName: comp.ariaName,
            propsSchema: comp.propsSchema,
          },
        })
      )
    )

    console.log(`✅ Seeded ${created.length} components`)
    console.log("Component categories:")
    const categories = new Set(created.map((c) => c.category))
    categories.forEach((cat) => {
      const count = created.filter((c) => c.category === cat).length
      console.log(`   • ${cat}: ${count}`)
    })
  } catch (error) {
    console.error("❌ Seed failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedComponents()
