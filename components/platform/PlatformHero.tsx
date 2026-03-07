import Link from "next/link"

export function PlatformHero() {
  return (
    <section className="relative min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          className="w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ backgroundColor: "color-mix(in srgb, var(--theme-accent, #c9a96e) 12%, transparent)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Label */}
        <p className="text-zinc-400 text-xs tracking-[0.3em] uppercase">
          Powered by Aria
        </p>

        {/* Aria orb */}
        <div className="relative flex items-center justify-center w-24 h-24" aria-hidden="true">
          {/* Outer pulsing ring */}
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, color-mix(in srgb, var(--theme-accent, #c9a96e) 40%, transparent), transparent 70%)`,
              boxShadow: `0 0 40px 8px color-mix(in srgb, var(--theme-accent, #c9a96e) 30%, transparent)`,
            }}
          />
          {/* Inner dark circle */}
          <div className="relative z-10 w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700">
            <span
              className="text-2xl"
              style={{ color: "var(--theme-accent, #c9a96e)" }}
            >
              ◎
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight">
          Your website,
          <br />
          built by voice.
        </h1>

        {/* Sub-headline */}
        <p className="text-zinc-400 text-lg max-w-xl text-center leading-relaxed">
          Tell Aria what you want. She builds it. Every headline, every product, edited by conversation.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <Link
            href="/demos"
            className="px-6 py-3 rounded-md font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--theme-accent, #c9a96e)" }}
          >
            See live demos →
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-md font-medium border border-zinc-700 text-zinc-300 transition-colors hover:border-zinc-500"
          >
            Start building
          </Link>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <span className="text-zinc-600 text-xs animate-bounce select-none">↓</span>
      </div>
    </section>
  )
}
