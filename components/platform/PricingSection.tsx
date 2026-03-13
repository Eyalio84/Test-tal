"use client"

import Link from "next/link"
import { EditOverlay } from "@/components/editor/EditOverlay"

interface PricingTier {
  name:        string
  price:       string
  description: string
  features:    string[]
  highlighted: boolean
}

const TIERS: PricingTier[] = [
  {
    name:        "Starter",
    price:       "$29/mo",
    description: "1 site, Aria on your storefront",
    features:    ["1 site", "8 themes", "Aria voice shopping", "50 products"],
    highlighted: false,
  },
  {
    name:        "Builder",
    price:       "$79/mo",
    description: "Aria edits your site by voice",
    features:    ["1 site", "Voice site editing", "Draft/publish workflow", "Undo/redo history"],
    highlighted: true,
  },
  {
    name:        "Agency",
    price:       "$199/mo",
    description: "Multiple sites, white-label Aria",
    features:    ["5 sites", "Custom Aria voice", "Client handoff", "Priority support"],
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <EditOverlay sectionId="cta" className="bg-zinc-900 px-6 py-20">
      <section className="w-full">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <div className="mb-12 flex flex-col gap-2 text-center">
          <h2 className="font-serif text-3xl text-white">Simple pricing</h2>
          <p className="text-zinc-500 text-sm">
            Start free. Upgrade when Aria makes sense.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={[
                "rounded-lg p-6 flex flex-col gap-5",
                tier.highlighted
                  ? "bg-white text-zinc-900"
                  : "bg-zinc-800 text-zinc-100",
              ].join(" ")}
            >
              {/* Tier name */}
              <p className="text-xs uppercase tracking-widest font-medium opacity-60">
                {tier.name}
              </p>

              {/* Price */}
              <p className="font-serif text-3xl">{tier.price}</p>

              {/* Description */}
              <p className="text-xs opacity-60 leading-relaxed">{tier.description}</p>

              {/* Features */}
              <ul className="flex flex-col gap-2 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/dashboard"
                aria-label={`Get started with ${tier.name}`}
                className={[
                  "mt-2 block text-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                  tier.highlighted
                    ? "bg-zinc-900 text-white hover:bg-zinc-700"
                    : "border border-zinc-600 hover:border-zinc-400 text-current",
                ].join(" ")}
              >
                Get started →
              </Link>
            </div>
          ))}
        </div>
      </div>
      </section>
    </EditOverlay>
  )
}
