import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { ProductCard } from "@/components/product/ProductCard"
import { SearchInput } from "@/components/products/SearchInput"

export const metadata: Metadata = {
  title: "Shop",
}

interface Props {
  searchParams: Promise<{ category?: string; q?: string; maxPrice?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category, q, maxPrice } = await searchParams

  const products = await prisma.product.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(q ? { name: { contains: q } } : {}),
      ...(maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {}),
    },
    orderBy: { createdAt: "asc" },
  })

  const allProducts = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
  })

  const categories = [
    "All",
    ...(allProducts.map((p) => p.category).filter(Boolean) as string[]),
  ]

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="font-serif text-3xl text-ink">Shop</h1>
            <Suspense>
              <SearchInput />
            </Suspense>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => {
              const isActive = cat === "All" ? !category : category === cat
              return (
                <Link
                  key={cat}
                  href={cat === "All" ? "/products" : `/products?category=${cat}`}
                  className={`text-xs tracking-widest uppercase px-4 py-1.5 border transition ${
                    isActive
                      ? "bg-ink text-white border-ink"
                      : "border-stone-200 text-ink/60 hover:border-ink hover:text-ink"
                  }`}
                >
                  {cat}
                </Link>
              )
            })}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-ink/40 text-sm mb-4">No products found.</p>
            <Link
              href="/products"
              className="text-xs tracking-widest uppercase border border-ink px-4 py-2 hover:bg-ink hover:text-white transition"
            >
              View all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                images={product.images}
                category={product.category}
                inStock={product.inStock}
                stockCount={product.stockCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
