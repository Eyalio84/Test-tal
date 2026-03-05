export function Footer() {
  return (
    <footer className="bg-ink text-white/60 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <p className="font-serif text-white text-xl mb-4">STORE</p>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="bg-white/10 border border-white/20 px-4 py-2 text-sm text-white placeholder:text-white/30 flex-1 focus:outline-none"
            />
            <button className="bg-white text-ink px-4 py-2 text-xs tracking-widest uppercase hover:bg-gold hover:text-white transition">
              Subscribe
            </button>
          </div>
        </div>
        <div>
          <p className="text-white text-xs tracking-widest uppercase mb-4">Customer</p>
          {["Shipping", "Returns", "FAQ"].map((l) => (
            <p key={l} className="text-sm mb-2 hover:text-white cursor-pointer transition">
              {l}
            </p>
          ))}
        </div>
        <div>
          <p className="text-white text-xs tracking-widest uppercase mb-4">Company</p>
          {["About", "Contact", "Privacy"].map((l) => (
            <p key={l} className="text-sm mb-2 hover:text-white cursor-pointer transition">
              {l}
            </p>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 text-xs">
        © {new Date().getFullYear()} Store. All rights reserved.
      </div>
    </footer>
  )
}
