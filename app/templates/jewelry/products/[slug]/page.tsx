import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { resolveTheme } from "@/lib/themeImages"
import { ProductGallery } from "@/components/product/ProductGallery"
import { ProductActions } from "@/components/product/ProductActions"
import { RelatedProducts } from "@/components/product/RelatedProducts"
import { RecentlyViewed } from "@/components/product/RecentlyViewed"
import { JsonLd } from "@/components/product/JsonLd"
import { ThemeApplierStatic } from "@/components/layout/ThemeApplierStatic"

interface Props {
  params: Promise<{ slug: string }>
}

// Render at request time — DB not available at build time
export const dynamic = "force-dynamic"

// Per-product Open Graph + Twitter card metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) return { title: "Not Found" }

  const images = JSON.parse(product.images) as string[]
  return {
    title: product.name,
    description: product.description ?? `${product.name} — handcrafted jewelry.`,
    openGraph: {
      title: product.name,
      description: product.description ?? "",
      images: images[0] ? [{ url: images[0], width: 800, height: 800, alt: product.name }] : [],
    },
  }
}

export default async function JewelryProductDetailPage({ params }: Props) {
  const { slug } = await params
  const theme = await resolveTheme("jewelry")
  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) notFound()

  const images = JSON.parse(product.images) as string[]
  const firstImage = images[0] ?? ""

  return (
    <>
      <ThemeApplierStatic theme={theme} />
      <div className="pt-24 pb-20">
        <JsonLd
          name={product.name}
          description={product.description}
          price={product.price}
          image={firstImage}
          slug={slug}
          inStock={product.inStock}
        />

        <div className="max-w-7xl mx-auto px-6">
          {/* Breadcrumb navigation */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-xs text-ink/40 tracking-wide">
              <li>
                <Link href="/templates/jewelry" className="hover:text-ink transition">
                  {theme.brand.name}
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <Link href="/templates/jewelry/products" className="hover:text-ink transition">
                  Shop
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              {product.category && (
                <>
                  <li>
                    <Link
                      href={`/templates/jewelry/products?category=${product.category}`}
                      className="hover:text-ink transition"
                    >
                      {product.category}
                    </Link>
                  </li>
                  <li aria-hidden="true">›</li>
                </>
              )}
              <li className="text-ink/70" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>

          {/* 2-column layout: gallery left, info right */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            <ProductGallery images={images} name={product.name} />

            <div className="flex flex-col justify-center">
              {product.category && (
                <p className="text-xs tracking-widest uppercase text-ink/40 mb-3">
                  {product.category}
                </p>
              )}
              <h1 className="font-serif text-3xl md:text-4xl text-ink leading-tight mb-4">
                {product.name}
              </h1>
              <p className="text-2xl text-ink mb-6">${product.price.toFixed(2)}</p>

              {product.description && (
                <p className="text-sm text-ink/60 leading-relaxed mb-8">{product.description}</p>
              )}

              <ProductActions
                id={product.id}
                name={product.name}
                price={product.price}
                image={firstImage}
                slug={slug}
                inStock={product.inStock}
                stockCount={product.stockCount}
                whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
              />

              {/* Trust signals */}
              <ul
                aria-label="Store policies"
                className="mt-8 pt-8 border-t border-stone-100 flex flex-col gap-3"
              >
                {[
                  "Free shipping on orders over $150",
                  "30-day hassle-free returns",
                  "Certificate of authenticity included",
                ].map((signal) => (
                  <li key={signal} className="flex items-center gap-3 text-xs text-ink/50">
                    <span aria-hidden="true" className="text-gold">
                      ✓
                    </span>
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <RelatedProducts category={product.category} excludeSlug={slug} />
          <RecentlyViewed currentSlug={slug} />
        </div>
      </div>
    </>
  )
}
