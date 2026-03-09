import * as React from "react"
import { Button } from "@/components/ui/Button"
import Image from "next/image"

// ── HeroSection ──
export interface HeroSectionProps {
  headline: string
  subheading?: string
  cta?: {
    text: string
    onClick?: () => void
  }
  backgroundImage?: string
}

export function HeroSection({
  headline,
  subheading,
  cta,
  backgroundImage,
}: HeroSectionProps) {
  return (
    <div className="relative min-h-96 flex items-center justify-center text-center overflow-hidden">
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt="Hero background"
          fill
          className="object-cover -z-10"
        />
      )}
      <div className="px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <h1 className="text-4xl sm:text-5xl font-serif text-white drop-shadow-lg mb-4">
          {headline}
        </h1>
        {subheading && (
          <p className="text-lg text-white/90 drop-shadow-md mb-6 max-w-2xl mx-auto">
            {subheading}
          </p>
        )}
        {cta && (
          <Button
            onClick={cta.onClick}
            size="lg"
            className="mt-4"
          >
            {cta.text}
          </Button>
        )}
      </div>
    </div>
  )
}

// ── FeaturesSection ──
export interface Feature {
  icon?: React.ReactNode
  title: string
  description: string
}

export interface FeaturesSectionProps {
  title?: string
  features: Feature[]
}

export function FeaturesSection({ title, features }: FeaturesSectionProps) {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      {title && (
        <h2 className="text-3xl font-serif text-center text-ink mb-12">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature, idx) => (
          <div key={idx} className="text-center">
            {feature.icon && (
              <div className="text-4xl mb-3 flex justify-center">{feature.icon}</div>
            )}
            <h3 className="text-lg font-semibold text-ink mb-2">{feature.title}</h3>
            <p className="text-sm text-ink/60">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── TestimonialsSection ──
export interface Testimonial {
  quote: string
  author: string
  role?: string
  avatar?: string
}

export interface TestimonialsSectionProps {
  title?: string
  testimonials: Testimonial[]
}

export function TestimonialsSection({
  title,
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-stone-50">
      {title && (
        <h2 className="text-3xl font-serif text-center text-ink mb-12">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {testimonials.map((testimonial, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-ink/80 mb-4 italic">"{testimonial.quote}"</p>
            <div className="flex items-center gap-3">
              {testimonial.avatar && (
                <div className="h-10 w-10 rounded-full bg-stone-200 flex-shrink-0 overflow-hidden">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-medium text-xs text-ink">{testimonial.author}</p>
                {testimonial.role && (
                  <p className="text-[10px] text-ink/50">{testimonial.role}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── CTASection ──
export interface CTASectionProps {
  headline: string
  buttonText?: string
  buttonUrl?: string
  onButtonClick?: () => void
}

export function CTASection({
  headline,
  buttonText = "Get Started",
  buttonUrl,
  onButtonClick,
}: CTASectionProps) {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-ink text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-serif mb-6">{headline}</h2>
        {buttonUrl ? (
          <a href={buttonUrl}>
            <Button size="lg" className="bg-white text-ink hover:bg-stone-100">
              {buttonText}
            </Button>
          </a>
        ) : (
          <Button size="lg" onClick={onButtonClick} className="bg-white text-ink hover:bg-stone-100">
            {buttonText}
          </Button>
        )}
      </div>
    </section>
  )
}
