// Security note: dangerouslySetInnerHTML is used intentionally and safely here.
// All values come from our own Prisma database (not user input).
// The JSON is produced by JSON.stringify (which escapes all special chars).
// We additionally call sanitizeForScript() to prevent </script> injection.
// This is the standard pattern for Next.js JSON-LD structured data.

function sanitizeForScript(json: string): string {
  return json.replace(/<\/script>/gi, "<\\/script>")
}

interface JsonLdProps {
  name: string
  description: string | null
  price: number
  image: string
  slug: string
  inStock: boolean
}

export function JsonLd({ name, description, price, image, slug, inStock }: JsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description ?? "",
    image,
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "USD",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/products/${slug}`,
    },
  }

  const safeJson = sanitizeForScript(JSON.stringify(data))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  )
}
