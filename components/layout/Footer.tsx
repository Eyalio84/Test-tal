import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-500 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
          {/* Brand */}
          <div>
            <p className="font-serif text-white text-xl mb-1">StoreKit</p>
            <p className="text-sm text-zinc-500">Your website, built by voice.</p>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-8 gap-y-2">
            <Link href="/templates" className="text-xs tracking-widest uppercase hover:text-white transition">Templates</Link>
            <Link href="/#pricing" className="text-xs tracking-widest uppercase hover:text-white transition">Pricing</Link>
            <Link href="/docs" className="text-xs tracking-widest uppercase hover:text-white transition">Docs</Link>
            <Link href="/about" className="text-xs tracking-widest uppercase hover:text-white transition">About</Link>
            <Link href="/contact" className="text-xs tracking-widest uppercase hover:text-white transition">Contact</Link>
          </nav>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs">© {new Date().getFullYear()} StoreKit. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-xs hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="text-xs hover:text-white transition">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
