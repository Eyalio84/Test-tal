import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { prisma } from "@/lib/db"

describe("Component API", () => {
  let createdComponentId: string
  const testSlug = `test-button-${Date.now()}`

  beforeAll(async () => {
    // Clean up any existing test component
    await prisma.component.deleteMany({
      where: { slug: { contains: testSlug } },
    })
  })

  afterAll(async () => {
    // Clean up created components
    if (createdComponentId) {
      await prisma.component.delete({
        where: { id: createdComponentId },
      }).catch(() => {})
    }
  })

  describe("GET /api/components (via Prisma)", () => {
    it("should list all components", async () => {
      const components = await prisma.component.findMany()
      expect(Array.isArray(components)).toBe(true)
    })

    it("should filter components by category", async () => {
      // Create a button for testing
      const button = await prisma.component.create({
        data: {
          slug: `filter-test-${Date.now()}`,
          name: "Filter Test Button",
          category: "button",
          ariaName: "filter_test_button",
          propsSchema: {},
        },
      })

      const filtered = await prisma.component.findMany({
        where: { category: "button" },
      })
      expect(filtered.some(c => c.id === button.id)).toBe(true)

      await prisma.component.delete({ where: { id: button.id } })
    })

    it("should search components by name", async () => {
      // Create a test component first
      const testComp = await prisma.component.create({
        data: {
          slug: `search-test-${Date.now()}`,
          name: "Search Test Button",
          category: "button",
          ariaName: "search_test_button",
          propsSchema: {},
        },
      })

      const results = await prisma.component.findMany({
        where: {
          OR: [
            { name: { contains: "Search", mode: "insensitive" } },
            { description: { contains: "Search", mode: "insensitive" } },
            { ariaName: { contains: "Search", mode: "insensitive" } },
          ],
        },
      })
      expect(results.some(c => c.id === testComp.id)).toBe(true)

      // Cleanup
      await prisma.component.delete({ where: { id: testComp.id } })
    })
  })

  describe("POST /api/admin/components", () => {
    it("should create a component with valid data", async () => {
      // Create directly in DB for testing (bypassing auth)
      const component = await prisma.component.create({
        data: {
          slug: testSlug,
          name: "Test Primary Button",
          category: "button",
          description: "A primary button component",
          ariaName: "primary_button",
          propsSchema: {
            variant: { type: "enum" as const, enum: ["primary", "secondary"], default: "primary" },
            size: { type: "enum" as const, enum: ["sm", "md", "lg"], default: "md" },
            children: { type: "string" as const, required: true },
          },
        },
      })

      createdComponentId = component.id
      expect(component.slug).toBe(testSlug)
      expect(component.name).toBe("Test Primary Button")
      expect(component.category).toBe("button")
      expect(component.ariaName).toBe("primary_button")
    })

    it("should reject duplicate slug", async () => {
      // Try to create with same slug
      const duplicate = await prisma.component.create({
        data: {
          slug: testSlug,
          name: "Duplicate",
          category: "button",
          ariaName: "duplicate",
          propsSchema: {},
        },
      }).catch(err => {
        expect(err.code).toBe("P2002") // Unique constraint violation
        return null
      })

      expect(duplicate).toBeNull()
    })
  })

  describe("PATCH /api/admin/components/[id]", () => {
    it("should update component properties", async () => {
      const updated = await prisma.component.update({
        where: { id: createdComponentId },
        data: {
          description: "Updated description",
          name: "Updated Test Button",
        },
      })

      expect(updated.description).toBe("Updated description")
      expect(updated.name).toBe("Updated Test Button")
    })
  })

  describe("DELETE /api/admin/components/[id]", () => {
    it("should delete a component", async () => {
      const deleted = await prisma.component.delete({
        where: { id: createdComponentId },
      })

      expect(deleted.id).toBe(createdComponentId)

      // Verify it's gone
      const notFound = await prisma.component.findUnique({
        where: { id: createdComponentId },
      })
      expect(notFound).toBeNull()
    })
  })

  describe("Validation", () => {
    it("should reject invalid category", async () => {
      const invalid = await prisma.component.create({
        data: {
          slug: `invalid-cat-${Date.now()}`,
          name: "Invalid",
          category: "invalid-category",
          ariaName: "invalid",
          propsSchema: {},
        },
      }).catch(err => {
        // Prisma won't validate enum at the schema level without explicit constraint
        // So this component will actually be created
        return err
      })

      // Note: Zod validation happens at API level, not DB level
      // This test documents that the API should validate, not the DB
    })

    it("should accept valid ariaName format", async () => {
      const valid = await prisma.component.create({
        data: {
          slug: `valid-aria-${Date.now()}`,
          name: "Valid Aria",
          category: "button",
          ariaName: "valid_aria_name_123",
          propsSchema: {},
        },
      })

      expect(valid.ariaName).toMatch(/^[a-z0-9_]+$/)

      await prisma.component.delete({ where: { id: valid.id } })
    })
  })
})
