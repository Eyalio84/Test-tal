import Link from "next/link"

interface HeroProps {
  headline: string
  subline?: string
  ctaText: string
  ctaHref: string
  imageSrc: string
  imageAlt: string
}

export function Hero({ headline, subline, ctaText, ctaHref, imageSrc, imageAlt }: HeroProps) {
  return (
    <section className="relative h-screen flex items-end">
      <div className="absolute inset-0 bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={imageAlt} className="w-full h-full object-cover opacity-75" />
      </div>
      <div className="relative z-10 px-8 pb-20 max-w-xl">
        <h1 className="text-white text-5xl md:text-7xl leading-tight mb-4">{headline}</h1>
        {subline && <p className="text-white/70 text-lg mb-8">{subline}</p>}
        <Link
          href={ctaHref}
          className="inline-block bg-white text-ink px-8 py-3 text-xs tracking-widest uppercase hover:bg-gold hover:text-white transition"
        >
          {ctaText}
        </Link>
      </div>
    </section>
  )
}
