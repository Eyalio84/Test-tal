import { lazy, type ComponentType } from "react"

// Maps componentSlug → lazily-loaded React component for page rendering.
// Soft FK: if a slug has no entry here, SectionRenderer shows a placeholder.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SECTION_REGISTRY: Record<string, React.LazyExoticComponent<ComponentType<any>>> = {
  "hero-section":       lazy(() => import("@/components/platform/PlatformHero")),
  "featured-products":  lazy(() => import("@/components/sections/FeaturedProducts")),
  "collections-grid":   lazy(() => import("@/components/sections/CollectionsGrid")),
  "cta-section":        lazy(() => import("@/components/sections/CtaSection")),
  "product-grid":       lazy(() => import("@/components/sections/ProductGrid")),
  "story-section":      lazy(() => import("@/components/sections/StorySection")),
  "team-section":       lazy(() => import("@/components/sections/TeamSection")),
  "menu-section":       lazy(() => import("@/components/sections/MenuSection")),
  "gallery-grid":       lazy(() => import("@/components/sections/GalleryGrid")),
  "features-section":   lazy(() => import("@/components/sections/FeaturesSection")),
  "pricing-section":    lazy(() => import("@/components/platform/PricingSection")),
}
