"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAria } from "@/store/aria"
import { useCart } from "@/store/cart"
import toast from "react-hot-toast"
// Invisible component — lives in layout, executes Aria's commands
export function AriaCommandDispatcher() {
  const router = useRouter()
  const { pendingCommand, clearCommand } = useAria()
  const { openCart, addItem } = useCart()

  useEffect(() => {
    if (!pendingCommand) return
    clearCommand()

    switch (pendingCommand.type) {
      case "NAVIGATE":
        router.push(pendingCommand.url)
        break

      case "SCROLL":
        switch (pendingCommand.direction) {
          case "up":     window.scrollBy({ top: -(pendingCommand.amount ?? 400), behavior: "smooth" }); break
          case "down":   window.scrollBy({ top:  (pendingCommand.amount ?? 400), behavior: "smooth" }); break
          case "top":    window.scrollTo({ top: 0,                               behavior: "smooth" }); break
          case "bottom": window.scrollTo({ top: document.body.scrollHeight,      behavior: "smooth" }); break
        }
        break

      case "ADD_TO_CART":
        // Demo products: data is embedded in the command — no DB fetch needed
        if (pendingCommand.price !== undefined) {
          addItem({
            id:    pendingCommand.slug,
            name:  pendingCommand.name,
            price: pendingCommand.price,
            slug:  pendingCommand.slug,
            image: pendingCommand.image ?? "",
          })
          toast.success(`${pendingCommand.name} added to cart`)
          break
        }
        // Member products: fetch from DB
        fetch(`/api/product/${pendingCommand.slug}`)
          .then((r) => r.json())
          .then((product) => {
            if (product?.id) {
              addItem({
                id:    product.id,
                name:  product.name,
                price: product.price,
                slug:  product.slug,
                image: product.images ? JSON.parse(product.images)[0] ?? "" : "",
              })
              toast.success(`${product.name} added to cart`)
            }
          })
          .catch(() => toast.error("Couldn't add that item — try again"))
        break

      case "OPEN_CART":
        openCart()
        break

      case "FILTER":
        router.push(`/products?category=${encodeURIComponent(pendingCommand.category)}`)
        break


    }
  }, [pendingCommand, clearCommand, router, openCart, addItem])

  return null
}
