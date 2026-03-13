export interface SectionDef {
  componentSlug: string
  props: Record<string, unknown>
}

export interface PageDef {
  slug: string
  title: string
  sections: SectionDef[]
}

/* ------------------------------------------------------------------ */
/*  Default page definitions shared by most themes                    */
/* ------------------------------------------------------------------ */

const DEFAULT_HOME_SECTIONS: SectionDef[] = [
  { componentSlug: "hero-section", props: {} },
  { componentSlug: "featured-products", props: { limit: 4 } },
  { componentSlug: "collections-grid", props: {} },
  { componentSlug: "cta-section", props: {} },
]

const DEFAULT_PRODUCTS_SECTIONS: SectionDef[] = [
  { componentSlug: "hero-section", props: { variant: "compact" } },
  { componentSlug: "product-grid", props: { columns: 3 } },
]

const DEFAULT_ABOUT_SECTIONS: SectionDef[] = [
  { componentSlug: "hero-section", props: { variant: "compact" } },
  { componentSlug: "story-section", props: {} },
  { componentSlug: "team-section", props: {} },
  { componentSlug: "cta-section", props: {} },
]

const DEFAULT_PAGES: PageDef[] = [
  { slug: "home", title: "Home", sections: DEFAULT_HOME_SECTIONS },
  { slug: "products", title: "Products", sections: DEFAULT_PRODUCTS_SECTIONS },
  { slug: "about", title: "About", sections: DEFAULT_ABOUT_SECTIONS },
]

/* ------------------------------------------------------------------ */
/*  Helper: clone default pages with per-theme overrides              */
/* ------------------------------------------------------------------ */

function clonePages(pages: PageDef[]): PageDef[] {
  return pages.map((p) => ({
    ...p,
    sections: p.sections.map((s) => ({ ...s, props: { ...s.props } })),
  }))
}

/** Insert a section after a given componentSlug in a page's sections array. */
function insertAfter(
  sections: SectionDef[],
  afterSlug: string,
  newSection: SectionDef,
): SectionDef[] {
  const idx = sections.findIndex((s) => s.componentSlug === afterSlug)
  const pos = idx === -1 ? sections.length : idx + 1
  return [...sections.slice(0, pos), newSection, ...sections.slice(pos)]
}

/** Replace a section by componentSlug. */
function replaceSection(
  sections: SectionDef[],
  targetSlug: string,
  replacement: SectionDef,
): SectionDef[] {
  return sections.map((s) =>
    s.componentSlug === targetSlug ? replacement : s,
  )
}

/* ------------------------------------------------------------------ */
/*  Theme-specific overrides                                          */
/* ------------------------------------------------------------------ */

function restaurantPages(): PageDef[] {
  const pages = clonePages(DEFAULT_PAGES)
  const home = pages.find((p) => p.slug === "home")!
  home.sections = insertAfter(home.sections, "featured-products", {
    componentSlug: "menu-section",
    props: {},
  })
  return pages
}

function portfolioPages(): PageDef[] {
  const pages = clonePages(DEFAULT_PAGES)
  const products = pages.find((p) => p.slug === "products")!
  products.sections = replaceSection(products.sections, "product-grid", {
    componentSlug: "gallery-grid",
    props: { columns: 3 },
  })
  return pages
}

function saasPages(): PageDef[] {
  const pages = clonePages(DEFAULT_PAGES)
  const home = pages.find((p) => p.slug === "home")!
  home.sections = insertAfter(home.sections, "hero-section", {
    componentSlug: "features-section",
    props: {},
  })
  // Insert pricing before cta
  home.sections = insertAfter(home.sections, "collections-grid", {
    componentSlug: "pricing-section",
    props: {},
  })
  return pages
}

/* ------------------------------------------------------------------ */
/*  Exported map: themeId → PageDef[]                                 */
/* ------------------------------------------------------------------ */

export const TEMPLATE_PAGES: Record<string, PageDef[]> = {
  jewelry: clonePages(DEFAULT_PAGES),
  candy: clonePages(DEFAULT_PAGES),
  bakery: clonePages(DEFAULT_PAGES),
  flowers: clonePages(DEFAULT_PAGES),
  wine: clonePages(DEFAULT_PAGES),
  restaurant: restaurantPages(),
  portfolio: portfolioPages(),
  saas: saasPages(),
}
