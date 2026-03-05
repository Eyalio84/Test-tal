import Link from "next/link"
import { AuthButtons } from "@/components/ui/AuthButtons"

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-wider text-ink">
          STORE
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {["Collections", "About", "Contact"].map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase()}`}
              className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition"
            >
              {item}
            </Link>
          ))}
        </nav>
        <AuthButtons />
      </div>
    </header>
  )
}
