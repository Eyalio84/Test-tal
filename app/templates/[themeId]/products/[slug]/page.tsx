import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { THEMES } from "@/lib/theme"
import { resolveTheme } from "@/lib/themeImages"
import { TemplateAddToCart } from "@/components/template/TemplateAddToCart"
import { ThemeApplierStatic } from "@/components/layout/ThemeApplierStatic"

export async function generateStaticParams() {
  return Object.entries(THEMES).flatMap(([themeId, theme]) =>
    theme.products.map((p) => ({ themeId, slug: p.slug }))
  )
}

export default async function TemplateProductDetailPage({
  params,
}: {
  params: Promise<{ themeId: string; slug: string }>
}) {
  const { themeId, slug } = await params
  const theme = await resolveTheme(themeId).catch(() => null)
  if (!theme) notFound()

  const product = theme.products.find((p) => p.slug === slug)
  if (!product) notFound()

  // Get related products: 3 random from same category, excluding current product
  const relatedProducts = theme.products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)

  // Trust signals - parse shipping info and add generic copy
  const shippingBullets = theme.shipping.split(" · ").slice(0, 3)

  return (
    <>
      <ThemeApplierStatic theme={theme} />
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-ink/50 mb-8">
            <Link href={`/templates/${themeId}`} className="hover:text-ink transition">
              {theme.brand.name}
            </Link>
            <span>›</span>
            <Link href={`/templates/${themeId}/products`} className="hover:text-ink transition">
              Shop
            </Link>
            <span>›</span>
            <span className="text-ink">{product.name}</span>
          </div>

          {/* Main Content - 2 Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Left: Image */}
            <div className="flex items-center justify-center">
              <div className="relative w-full aspect-square bg-stone-50 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex flex-col justify-start">
              {/* Category */}
              <p className="text-xs text-ink/40 uppercase tracking-wider mb-4">{product.category}</p>

              {/* Product Name */}
              <h1 className="font-serif text-4xl text-ink mb-2">{product.name}</h1>

              {/* Price */}
              <p className="text-2xl text-ink font-medium mb-6">${product.price.toFixed(2)}</p>

              {/* Description */}
              <p className="text-ink/70 text-base leading-relaxed mb-8">{product.description}</p>

              {/* Add to Cart */}
              <div className="mb-8">
                <TemplateAddToCart product={product} themeId={themeId} />
              </div>

              {/* Trust Signals */}
              <div className="space-y-2 mb-8 pb-8 border-b border-stone-200">
                {shippingBullets.map((bullet, i) => (
                  <p key={i} className="text-xs text-ink/60 leading-relaxed">
                    ✓ {bullet}
                  </p>
                ))}
                <p className="text-xs text-ink/60 leading-relaxed">✓ 30-day returns guarantee</p>
                <p className="text-xs text-ink/60 leading-relaxed">✓ Secure, encrypted checkout</p>
              </div>

              {/* Stock Info */}
              {product.inStock === false ? (
                <div className="text-xs text-red-600 font-medium">Out of stock</div>
              ) : product.stockCount !== undefined && product.stockCount < 5 ? (
                <p className="text-xs text-ink/60 mb-4">Only {product.stockCount} left in stock</p>
              ) : null}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-stone-200 pt-12">
              <h2 className="font-serif text-2xl text-ink mb-6">You might also like</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedProducts.map((relProduct) => (
                  <Link
                    key={relProduct.slug}
                    href={`/templates/${themeId}/products/${relProduct.slug}`}
                    className="group"
                  >
                    <div className="relative h-48 overflow-hidden mb-3 bg-stone-50">
                      <Image
                        src={relProduct.image}
                        alt={relProduct.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-xs text-ink/40 uppercase tracking-wider mb-1">
                      {relProduct.category}
                    </p>
                    <p className="text-ink text-sm font-medium">{relProduct.name}</p>
                    <p className="text-ink/60 text-xs mt-0.5">${relProduct.price.toFixed(2)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
