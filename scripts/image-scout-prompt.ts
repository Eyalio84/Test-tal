/**
 * Prompt template for the Image Scout Gemini agent.
 *
 * Design principles:
 * - Queries must be 2-5 words (Pexels performs best on short, precise queries)
 * - Focus on SUBJECT (what the product IS), not adjectives
 * - Prioritise product-on-white or clean background photography
 * - Avoid lifestyle shots with people unless the product IS a person (portraits)
 * - Match the aesthetic descriptor of the store
 * - Generate query VARIETY — don't just rephrase the same query 3 times
 */

export interface ScoutProduct {
  slot:        string  // "hero" | product slug
  name:        string
  description: string
}

export interface ScoutTheme {
  themeId:   string
  aesthetic: string  // e.g. "dark, moody, luxury fine jewelry"
  products:  ScoutProduct[]
}

export function buildScoutPrompt(theme: ScoutTheme): string {
  const productLines = theme.products
    .map((p) => `- slot: "${p.slot}" | name: "${p.name}" | description: "${p.description}"`)
    .join("\n")

  return `You are an expert image curator for a demo e-commerce platform called StoreKit.

Store: ${theme.themeId}
Aesthetic: ${theme.aesthetic}

Your job is to generate Pexels search queries for each product slot listed below.
Each query will be sent to the Pexels API to find real stock photography.

RULES:
1. Each slot gets exactly 3 queries.
2. Queries must be 2-5 words — short and precise beats long and descriptive on Pexels.
3. Focus on the subject itself. NOT adjectives. "sourdough bread loaf" beats "rustic artisan freshly baked bread".
4. The 3 queries per slot must be meaningfully different (not rephrases):
   - Query 1: the product subject directly (e.g. "sourdough bread")
   - Query 2: the product in context (e.g. "bread bakery counter")
   - Query 3: an aesthetic/mood angle (e.g. "artisan bread closeup")
5. For "hero" slots: return queries for a wide atmospheric shot, not a product shot.
6. Avoid queries that commonly return: people's faces, restaurant dining rooms, generic office stock.
7. Match the store aesthetic — a fine jewelry store wants dark, moody, minimal; a candy shop wants bright, colorful.

Products:
${productLines}

Respond ONLY with valid JSON in this exact shape (no markdown, no explanation):
[
  { "slot": "hero", "queries": ["...", "...", "..."] },
  { "slot": "gold-bracelet-set", "queries": ["...", "...", "..."] }
]`
}

/** Aesthetic descriptions for each theme — tuned for Pexels query effectiveness */
export const THEME_AESTHETICS: Record<string, string> = {
  jewelry:    "dark moody minimal, luxury product photography, black or dark background",
  candy:      "bright colorful playful, white or pastel background, overhead flat lay",
  bakery:     "warm natural light, rustic wood surfaces, food photography closeup",
  flowers:    "soft light pastel tones, botanical, fresh flowers on white or light surface",
  wine:       "dark elegant, moody cellar, dramatic lighting, bottle photography",
  restaurant: "fine dining plated food, restaurant photography, dramatic lighting",
  portfolio:  "photography studio, camera equipment, editorial, black and white option",
  saas:       "clean tech, laptop code, dashboard UI, minimal white or dark background",
}
