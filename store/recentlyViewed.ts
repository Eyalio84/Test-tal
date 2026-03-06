import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface RecentProduct {
  id: string
  name: string
  slug: string
  price: number
  image: string
  category: string | null
}

interface RecentlyViewedStore {
  items: RecentProduct[]
  add: (product: RecentProduct) => void
  clear: () => void
}

export const useRecentlyViewed = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      add: (product) =>
        set((s) => {
          const filtered = s.items.filter((i) => i.slug !== product.slug)
          return { items: [product, ...filtered].slice(0, 6) }
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "recently-viewed-storage" }
  )
)
