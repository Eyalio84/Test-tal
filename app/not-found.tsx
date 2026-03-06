import Link from "next/link"

export default function NotFound() {
  return (
    <div className="pt-16 min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-8xl text-ink/10 select-none">404</p>
      <h1 className="font-serif text-3xl text-ink -mt-4 mb-3">Page not found</h1>
      <p className="text-sm text-ink/50 mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="text-xs tracking-widest uppercase border border-ink px-6 py-2.5 text-ink hover:bg-ink hover:text-white transition"
      >
        Go Home
      </Link>
    </div>
  )
}
