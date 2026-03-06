import type { TourStep } from "@/store/aria"

export const STORE_TOUR: TourStep[] = [
  {
    selector:    "header",
    title:       "Welcome to the Store",
    description: "Navigate using the menu — Shop, Collections, About and Contact are all one tap away.",
    position:    "bottom",
  },
  {
    selector:    "[aria-label^='Open cart']",
    title:       "Your Cart",
    description: "Your cart lives here. Just say the name of any piece and I'll add it for you.",
    position:    "bottom",
  },
  {
    selector:    "#main-content",
    title:       "Handcrafted with Intention",
    description: "Every piece is made by hand. Say 'show me rings' or 'take me to the shop' and I'll guide you.",
    position:    "bottom",
  },
  {
    selector:    "[aria-label='Open assistant menu']",
    title:       "That's Me — Aria ✦",
    description: "Tap this orb anytime to talk to me. Try 'add pearl drop earrings to cart' or ask what I recommend.",
    position:    "top",
  },
]
