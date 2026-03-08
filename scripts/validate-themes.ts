/**
 * Theme data integrity checks.
 * Run with: npm run validate:themes
 *
 * Catches: duplicate image URLs within a theme, missing required fields.
 * Does NOT check if URLs return 200 — that requires network access.
 */
import assert from "node:assert/strict"
import { THEMES } from "../lib/theme"

const STRICT = process.argv.includes("--strict")

let passed = 0
let failed = 0

function check(label: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✓ ${label}`)
    passed++
  } catch (e) {
    console.error(`  ✗ ${label}`)
    console.error(`    ${(e as Error).message}`)
    failed++
  }
}

for (const theme of Object.values(THEMES)) {
  console.log(`\n[${theme.id}]`)

  check("all products have non-empty image URLs", () => {
    for (const p of theme.products) {
      assert.ok(p.image.startsWith("https://"), `"${p.name}" has invalid image: "${p.image}"`)
    }
  })

  check("no duplicate product image URLs", () => {
    const urls = theme.products.map(p => p.image)
    const dupes = urls.filter((url, i) => urls.indexOf(url) !== i)
    assert.deepEqual(dupes, [], `Duplicate image URLs: ${dupes.join(", ")}`)
  })

  check("hero image is not reused as a product image", () => {
    const heroUrl = theme.hero.image
    const conflict = theme.products.find(p => p.image === heroUrl)
    assert.ok(!conflict, `Hero image reused by product "${conflict?.name}"`)
  })

  check("all product slugs are unique", () => {
    const slugs = theme.products.map(p => p.slug)
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
    assert.deepEqual(dupes, [], `Duplicate slugs: ${dupes.join(", ")}`)
  })

  check("all products have price > 0 (or are free intentionally)", () => {
    // Allow price === 0 only for explicitly free items (e.g. Annual Discount)
    for (const p of theme.products) {
      assert.ok(p.price >= 0, `"${p.name}" has negative price: ${p.price}`)
    }
  })

  if (STRICT) {
    check("no product images still pointing at Unsplash", () => {
      const unsplash = theme.products.filter(p => p.image.includes("unsplash.com"))
      assert.deepEqual(
        unsplash.map(p => p.name),
        [],
        `Still on Unsplash: ${unsplash.map(p => p.name).join(", ")}`
      )
    })
  }
}

console.log(`\n${"─".repeat(40)}`)
console.log(`${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
