import * as React from "react"
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import Image from "next/image"

// ── ProductCard ──
export interface ProductCardProps {
  image?: string
  name: string
  price: number
  description?: string
  ctaText?: string
  onCta?: () => void
}

export function ProductCard({
  image,
  name,
  price,
  description,
  ctaText = "Add to Cart",
  onCta,
}: ProductCardProps) {
  return (
    <Card variant="default" padding="none">
      {image && (
        <div className="relative aspect-square bg-stone-100">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <CardBody>
        <h3 className="font-medium text-sm text-ink mb-1">{name}</h3>
        {description && (
          <p className="text-xs text-ink/60 mb-2 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-semibold text-sm text-ink">${price.toFixed(2)}</span>
          <Button size="sm" onClick={onCta}>
            {ctaText}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

// ── TestimonialCard ──
export interface TestimonialCardProps {
  quote: string
  author: string
  role?: string
  avatar?: string
  rating?: number
}

export function TestimonialCard({
  quote,
  author,
  role,
  avatar,
  rating,
}: TestimonialCardProps) {
  return (
    <Card variant="default" padding="md">
      {rating && (
        <div className="mb-3 flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={i < rating ? "text-yellow-400 text-lg" : "text-stone-300 text-lg"}
            >
              ★
            </span>
          ))}
        </div>
      )}
      <p className="text-sm text-ink/80 mb-3 italic">"{quote}"</p>
      <div className="flex items-center gap-2">
        {avatar && (
          <div className="h-8 w-8 rounded-full bg-stone-200 flex-shrink-0">
            <Image
              src={avatar}
              alt={author}
              width={32}
              height={32}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        )}
        <div>
          <p className="font-medium text-xs text-ink">{author}</p>
          {role && <p className="text-[10px] text-ink/50">{role}</p>}
        </div>
      </div>
    </Card>
  )
}

// ── FeatureCard ──
export interface FeatureCardProps {
  icon?: React.ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card variant="default" padding="md">
      {icon && <div className="mb-3 text-2xl">{icon}</div>}
      <h3 className="font-semibold text-sm text-ink mb-1">{title}</h3>
      <p className="text-xs text-ink/60">{description}</p>
    </Card>
  )
}

// ── StatCard ──
export interface StatCardProps {
  value: string | number
  label: string
  change?: string
  changeType?: "positive" | "negative"
}

export function StatCard({ value, label, change, changeType }: StatCardProps) {
  return (
    <Card variant="stat" padding="md">
      <p className="text-2xl font-semibold text-ink mb-1">{value}</p>
      <p className="text-xs text-ink/60 mb-2">{label}</p>
      {change && (
        <p
          className={`text-xs font-medium ${
            changeType === "positive" ? "text-green-600" : "text-red-600"
          }`}
        >
          {changeType === "positive" ? "↑" : "↓"} {change}
        </p>
      )}
    </Card>
  )
}

// ── PricingCard ──
export interface PricingCardProps {
  name: string
  price: number
  features: string[]
  highlighted?: boolean
  ctaText?: string
  onCta?: () => void
}

export function PricingCard({
  name,
  price,
  features,
  highlighted = false,
  ctaText = "Get Started",
  onCta,
}: PricingCardProps) {
  return (
    <Card
      variant="default"
      padding="lg"
      className={highlighted ? "ring-2 ring-ink" : ""}
    >
      {highlighted && (
        <Badge className="mb-3 bg-ink text-white">Most Popular</Badge>
      )}
      <h3 className="font-semibold text-lg text-ink mb-1">{name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-ink">${price}</span>
        <span className="text-xs text-ink/50">/month</span>
      </div>
      <ul className="space-y-2 mb-4">
        {features.map((feature, idx) => (
          <li key={idx} className="text-xs text-ink/70 flex items-center gap-2">
            <span className="text-green-600">✓</span> {feature}
          </li>
        ))}
      </ul>
      <Button
        variant={highlighted ? "primary" : "outline"}
        className="w-full"
        onClick={onCta}
      >
        {ctaText}
      </Button>
    </Card>
  )
}
