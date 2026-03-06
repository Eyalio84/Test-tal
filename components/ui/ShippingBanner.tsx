export function ShippingBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-50 h-8 bg-ink text-white flex items-center justify-center text-xs tracking-widest uppercase px-4 overflow-hidden">
      <span className="hidden sm:inline">Free shipping on orders over $150&nbsp;·&nbsp;Easy 30-day returns&nbsp;·&nbsp;</span>
      <span>SSL secured checkout</span>
    </div>
  )
}
