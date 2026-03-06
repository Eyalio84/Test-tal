import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WishlistStore {
  slugs: string[]
  toggle: (slug: string) => void
  isWished: (slug: string) => boolean
  clear: () => void
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) =>
        set((s) => ({
          slugs: s.slugs.includes(slug)
            ? s.slugs.filter((s2) => s2 !== slug)
            : [...s.slugs, slug],
        })),
      isWished: (slug) => get().slugs.includes(slug),
      clear: () => set({ slugs: [] }),
    }),
    { name: "wishlist-storage" }
  )
)
