import { prisma } from "@/lib/db"
import { ProductCard } from "@/components/product/ProductCard"

interface Props {
  category: string | null
  excludeSlug: string
}

export async function RelatedProducts({ category, excludeSlug }: Props) {
  if (!category) return null

  const products = await prisma.product.findMany({
    where: { category, slug: { not: excludeSlug }, inStock: true },
    take: 4,
    orderBy: { createdAt: "asc" },
  })

  if (products.length === 0) return null

  return (
    <section aria-labelledby="related-heading" className="mt-20 pt-16 border-t border-stone-100">
      <h2 id="related-heading" className="font-serif text-2xl text-ink mb-8">
        You may also love
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            slug={p.slug}
            price={p.price}
            images={p.images}
            category={p.category}
            inStock={p.inStock}
            stockCount={p.stockCount}
          />
        ))}
      </div>
    </section>
  )
}
