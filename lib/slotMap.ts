/**
 * CDN Slot Map — defines every image slot across all 8 themes.
 * Used by Image Scout to populate the UI slot picker and auto-generate prompts.
 * Slot names must match ThemeImage.slot and r2Key() convention.
 */

export interface ThemeSlot {
  slot:        string   // matches R2 key and ThemeImage.slot
  label:       string   // human-readable label for the UI
  promptHint:  string   // auto-prefilled Pexels search prompt
  aspectRatio: "landscape" | "portrait" | "square"
}

export const SLOT_MAP: Record<string, ThemeSlot[]> = {
  jewelry: [
    { slot: "hero",       label: "Hero",              promptHint: "luxury jewelry store, gold and white, minimal elegant",   aspectRatio: "landscape" },
    { slot: "rings",      label: "Rings Collection",  promptHint: "elegant gold rings, white background, jewelry photography", aspectRatio: "landscape" },
    { slot: "necklaces",  label: "Necklaces",         promptHint: "delicate gold necklace, minimal, fine jewelry",            aspectRatio: "landscape" },
    { slot: "earrings",   label: "Earrings",          promptHint: "gold earrings collection, studio photography, luxury",     aspectRatio: "landscape" },
    { slot: "bracelets",  label: "Bracelets",         promptHint: "gold bracelet bangle, jewelry photography, minimal",       aspectRatio: "landscape" },
    { slot: "pendants",   label: "Pendants",          promptHint: "gold pendant necklace, fine jewelry, white background",    aspectRatio: "landscape" },
    { slot: "about",      label: "About Page",        promptHint: "jewelry artisan workshop, goldsmith craftsmanship",        aspectRatio: "landscape" },
    { slot: "team-1",     label: "Team — Designer",   promptHint: "jewelry designer professional portrait, studio",           aspectRatio: "portrait"  },
    { slot: "team-2",     label: "Team — Artisan",    promptHint: "goldsmith artisan portrait, professional, crafts",         aspectRatio: "portrait"  },
  ],

  candy: [
    { slot: "hero",       label: "Hero",              promptHint: "colorful candy store interior, bright, playful, sweet shop", aspectRatio: "landscape" },
    { slot: "chocolates", label: "Chocolates",        promptHint: "assorted chocolates, dark and milk, luxury candy",          aspectRatio: "landscape" },
    { slot: "gummies",    label: "Gummies",           promptHint: "colorful gummy candies, bright, fun, candy shop",           aspectRatio: "landscape" },
    { slot: "lollipops",  label: "Lollipops",         promptHint: "colorful lollipops, candy store, bright background",        aspectRatio: "landscape" },
    { slot: "fudge",      label: "Fudge",             promptHint: "homemade fudge pieces, rustic, sweet, chocolate",           aspectRatio: "landscape" },
    { slot: "about",      label: "About Page",        promptHint: "candy making process, sweet shop kitchen, confectionery",   aspectRatio: "landscape" },
    { slot: "team-1",     label: "Team — Chocolatier",promptHint: "chocolatier professional portrait, candy maker",            aspectRatio: "portrait"  },
    { slot: "team-2",     label: "Team — Owner",      promptHint: "sweet shop owner portrait, cheerful, professional",         aspectRatio: "portrait"  },
  ],

  bakery: [
    { slot: "hero",       label: "Hero",              promptHint: "artisan bakery interior, warm, freshly baked bread, cozy",  aspectRatio: "landscape" },
    { slot: "breads",     label: "Breads",            promptHint: "artisan sourdough bread, bakery, rustic, warm tones",       aspectRatio: "landscape" },
    { slot: "pastries",   label: "Pastries",          promptHint: "fresh croissants pastries, French bakery, golden brown",    aspectRatio: "landscape" },
    { slot: "cakes",      label: "Cakes",             promptHint: "celebration cake, bakery, elegant, layered cake",           aspectRatio: "landscape" },
    { slot: "seasonal",   label: "Seasonal",          promptHint: "seasonal baked goods, holiday pastries, bakery window",     aspectRatio: "landscape" },
    { slot: "about",      label: "About Page",        promptHint: "baker at work, artisan bread making, flour dusted hands",   aspectRatio: "landscape" },
    { slot: "team-1",     label: "Head Baker",        promptHint: "master baker portrait, professional, bakery setting",       aspectRatio: "portrait"  },
    { slot: "team-2",     label: "Pastry Chef",       promptHint: "pastry chef portrait, white chef coat, professional",       aspectRatio: "portrait"  },
  ],

  flowers: [
    { slot: "hero",       label: "Hero",              promptHint: "luxury flower shop interior, colorful blooms, elegant",     aspectRatio: "landscape" },
    { slot: "bouquets",   label: "Bouquets",          promptHint: "fresh flower bouquets, colorful, elegant arrangement",      aspectRatio: "landscape" },
    { slot: "roses",      label: "Roses",             promptHint: "red and pink roses, close up, romantic, florist",           aspectRatio: "landscape" },
    { slot: "wildflowers",label: "Wildflowers",       promptHint: "wildflower arrangement, natural, boho, meadow flowers",     aspectRatio: "landscape" },
    { slot: "events",     label: "Event Florals",     promptHint: "wedding floral arrangement, event flowers, elegant",        aspectRatio: "landscape" },
    { slot: "about",      label: "About Page",        promptHint: "florist arranging flowers, flower shop workshop, blooms",   aspectRatio: "landscape" },
    { slot: "team-1",     label: "Lead Florist",      promptHint: "florist portrait, flower shop, professional, flowers",      aspectRatio: "portrait"  },
    { slot: "team-2",     label: "Designer",          promptHint: "floral designer portrait, studio, professional",            aspectRatio: "portrait"  },
  ],

  wine: [
    { slot: "hero",       label: "Hero",              promptHint: "wine cellar interior, oak barrels, moody lighting, luxury", aspectRatio: "landscape" },
    { slot: "reds",       label: "Red Wines",         promptHint: "red wine glass, vineyard, deep rich color, elegant",        aspectRatio: "landscape" },
    { slot: "whites",     label: "White Wines",       promptHint: "white wine glass, crisp, golden light, wine tasting",       aspectRatio: "landscape" },
    { slot: "roses",      label: "Rosé Wines",        promptHint: "rosé wine glass, pink, summer, elegant table setting",      aspectRatio: "landscape" },
    { slot: "cellar",     label: "The Cellar",        promptHint: "wine cellar bottle storage, moody, stone walls, romantic",  aspectRatio: "landscape" },
    { slot: "about",      label: "About Page",        promptHint: "winemaker at vineyard, grapes harvest, wine estate",        aspectRatio: "landscape" },
    { slot: "team-1",     label: "Sommelier",         promptHint: "wine sommelier portrait, cellar, professional, elegant",    aspectRatio: "portrait"  },
    { slot: "team-2",     label: "Winemaker",         promptHint: "winemaker portrait, vineyard, professional, outdoors",      aspectRatio: "portrait"  },
  ],

  restaurant: [
    { slot: "hero",       label: "Hero",              promptHint: "upscale restaurant interior, candlelit, French bistro, elegant", aspectRatio: "landscape" },
    { slot: "starters",   label: "Starters",          promptHint: "elegant appetizer plating, restaurant, fine dining, gourmet",   aspectRatio: "landscape" },
    { slot: "mains",      label: "Main Courses",      promptHint: "main course fine dining, restaurant plating, gourmet food",      aspectRatio: "landscape" },
    { slot: "desserts",   label: "Desserts",          promptHint: "elegant dessert plating, French pastry, restaurant, beautiful",  aspectRatio: "landscape" },
    { slot: "drinks",     label: "Cocktails & Wine",  promptHint: "cocktail bar, elegant drinks, restaurant ambiance, night",       aspectRatio: "landscape" },
    { slot: "about",      label: "About Page",        promptHint: "chef at work, restaurant kitchen, professional cooking",         aspectRatio: "landscape" },
    { slot: "team-1",     label: "Executive Chef",    promptHint: "executive chef portrait, white coat, restaurant kitchen",        aspectRatio: "portrait"  },
    { slot: "team-2",     label: "Sommelier",         promptHint: "restaurant sommelier portrait, wine, professional",              aspectRatio: "portrait"  },
    { slot: "team-3",     label: "Maître D'",         promptHint: "restaurant manager portrait, elegant, professional, suit",       aspectRatio: "portrait"  },
  ],

  portfolio: [
    { slot: "hero",       label: "Hero",              promptHint: "professional photographer studio, cameras, moody, creative",   aspectRatio: "landscape" },
    { slot: "portraits",  label: "Portraits",         promptHint: "portrait photography studio, professional, moody lighting",     aspectRatio: "landscape" },
    { slot: "landscapes", label: "Landscapes",        promptHint: "dramatic landscape photography, nature, wide angle, epic",      aspectRatio: "landscape" },
    { slot: "events",     label: "Events",            promptHint: "event photography, wedding, people, candid moments",            aspectRatio: "landscape" },
    { slot: "commercial", label: "Commercial",        promptHint: "commercial product photography, studio, professional, brand",   aspectRatio: "landscape" },
    { slot: "about",      label: "About Page",        promptHint: "photographer behind camera, creative, studio, professional",    aspectRatio: "landscape" },
    { slot: "team-1",     label: "Lead Photographer", promptHint: "photographer portrait, creative professional, studio",          aspectRatio: "portrait"  },
    { slot: "team-2",     label: "Second Shooter",    promptHint: "photographer assistant portrait, creative, professional",       aspectRatio: "portrait"  },
  ],

  saas: [
    { slot: "hero",       label: "Hero",              promptHint: "modern SaaS product dashboard, clean UI, tech, purple blue",   aspectRatio: "landscape" },
    { slot: "features",   label: "Features",          promptHint: "software product features, UI mockup, clean tech product",     aspectRatio: "landscape" },
    { slot: "dashboard",  label: "Dashboard",         promptHint: "analytics dashboard, data visualization, clean software UI",   aspectRatio: "landscape" },
    { slot: "team",       label: "Team at Work",      promptHint: "modern tech office, startup team, collaboration, computers",   aspectRatio: "landscape" },
    { slot: "about",      label: "About Page",        promptHint: "tech startup office, modern workspace, team working",          aspectRatio: "landscape" },
    { slot: "team-1",     label: "CEO",               promptHint: "tech CEO portrait, professional, modern office, confident",    aspectRatio: "portrait"  },
    { slot: "team-2",     label: "CTO",               promptHint: "software engineer portrait, tech professional, modern office", aspectRatio: "portrait"  },
    { slot: "team-3",     label: "Head of Design",    promptHint: "UX designer portrait, creative professional, modern office",   aspectRatio: "portrait"  },
  ],
}

export const THEME_IDS = Object.keys(SLOT_MAP) as string[]

export function getSlotsForTheme(themeId: string): ThemeSlot[] {
  return SLOT_MAP[themeId] ?? []
}

export function getSlot(themeId: string, slot: string): ThemeSlot | undefined {
  return SLOT_MAP[themeId]?.find(s => s.slot === slot)
}
