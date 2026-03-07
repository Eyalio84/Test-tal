import { activeTheme } from "@/lib/theme"

export function ShippingBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-50 h-8 bg-ink text-white flex items-center justify-center text-xs tracking-widest uppercase px-4 overflow-hidden">
      <span>{activeTheme.shipping}</span>
    </div>
  )
}
