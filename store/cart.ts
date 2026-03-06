import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  id: string        // productId
  name: string
  price: number
  image: string
  slug: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  giftNote: string
  announcement: string

  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void

  openCart: () => void
  closeCart: () => void

  setGiftNote: (note: string) => void
  announce: (msg: string) => void

  totalItems: () => number
  totalPrice: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      giftNote: "",
      announcement: "",

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        })
        get().announce(`${item.name} added to cart`)
      },

      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id)
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }))
        if (item) get().announce(`${item.name} removed from cart`)
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id)
          return
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }))
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      setGiftNote: (note) => set({ giftNote: note }),
      announce: (msg) => set({ announcement: msg }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "cart-storage",
      // Persist items + giftNote only — isOpen and announcement are transient
      partialize: (state) => ({ items: state.items, giftNote: state.giftNote }),
    }
  )
)
