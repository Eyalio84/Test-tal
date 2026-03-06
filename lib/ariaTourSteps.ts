import type { TourStep } from "@/store/aria"

export const STORE_TOUR: TourStep[] = [
  {
    selector:    "header",
    title:       "Hey Tal — Welcome",
    description: "Eyal built this entire store to show you what's possible. Voice-first, AI-powered, handcrafted from scratch.",
    position:    "bottom",
    narration:   "Tal! I'm Aria. Eyal built me — and everything you're seeing right now — to give you a glimpse of what he creates. This store is voice-first, AI-powered, and built from scratch. And honestly? It's just the tip of the iceberg. Let me take you around.",
  },
  {
    selector:    "nav a[href='/products'], nav a[href='/collections']",
    title:       "Navigate by Voice",
    description: "Every page is one voice command away. 'Take me to the shop', 'show me collections', 'go to about'.",
    position:    "bottom",
    narration:   "The entire store is navigable by voice. Just say 'take me to the shop', 'show me collections', or 'go to about' — and I'll take you there instantly. No tapping, no searching.",
  },
  {
    selector:    "[aria-label^='Open cart']",
    title:       "Your Cart — Hands Free",
    description: "Say any product name and I'll add it. 'Add the sapphire ring', 'put the pearl earrings in my cart'.",
    position:    "bottom",
    narration:   "Your cart lives here — but you'll rarely need to tap it. Just say the name of anything you love. 'Add the sapphire ring', 'put the gold bracelet in my cart' — I'll handle it. I can also read your cart back to you and tell you the total.",
  },
  {
    selector:    "#main-content",
    title:       "Eight Handcrafted Pieces",
    description: "Every product is real data — stock levels, categories, prices. Ask me anything about them.",
    position:    "bottom",
    narration:   "Eight handcrafted jewelry pieces, each with real stock levels, categories, and pricing. I know all of them. Ask me anything — 'what's under a hundred dollars?', 'describe the emerald studs', 'is the diamond pendant in stock?' — I'll answer.",
  },
  {
    selector:    "input[placeholder*='Search'], input[type='search'], [data-search]",
    title:       "Filter by Voice or Tap",
    description: "Search by name, filter by category or price. 'Show me rings', 'items under $80', 'show earrings'.",
    position:    "bottom",
    narration:   "Search by name, filter by category, filter by price — all by voice or by tap. Say 'show me rings' and the page updates. Say 'items under eighty dollars' and I'll filter it live. The whole catalog responds to your voice.",
  },
  {
    selector:    "[aria-label*='wishlist'], [aria-label*='Wishlist'], button[aria-label*='wish']",
    title:       "Save What You Love",
    description: "Wishlist any piece by tapping the heart — or just tell me. 'Save the rose gold necklace for me.'",
    position:    "top",
    narration:   "See something you love? Heart it — or just tell me. Say 'save the rose gold necklace' and I'll wishlist it. Your saved pieces stay across sessions, and I can tell you exactly what's in your wishlist any time you ask.",
  },
  {
    selector:    "[aria-label='Open assistant menu']",
    title:       "That's Me — Aria ✦",
    description: "Navigate · filter · add to cart · check stock · read cart · describe products — all by voice. And this is just the start.",
    position:    "top",
    narration:   "That's me. Tap this orb any time to talk. I navigate pages, filter products, add items to cart, read your cart back, check stock levels, describe what's on your screen — all by voice. Eyal built all of this, and Tal — what you've seen today is genuinely just the beginning. When Eyal builds, the only real limit is imagination. And even that keeps moving.",
  },
]
