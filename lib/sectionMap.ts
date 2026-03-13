export type PanelModule = "text" | "image" | "color" | "order"

export interface SectionConfig {
  label: string
  keys: string[] // content keys this section edits
  module: PanelModule
}

export const SECTION_MAP: Record<string, SectionConfig> = {
  hero: {
    label: "Hero Section",
    keys: ["hero_headline", "hero_subline"],
    module: "text",
  },
  hero_image: {
    label: "Hero Image",
    keys: ["hero_image"],
    module: "image",
  },
  cta: {
    label: "Call to Action",
    keys: ["cta_headline", "cta_body"],
    module: "text",
  },
  collections: {
    label: "Collections",
    keys: ["collection_1_name", "collection_2_name", "collection_3_name"],
    module: "text",
  },
  accent: {
    label: "Accent Color",
    keys: ["theme_accent"],
    module: "color",
  },
  sections: {
    label: "Page Layout",
    keys: ["sections_order"],
    module: "order",
  },
}
