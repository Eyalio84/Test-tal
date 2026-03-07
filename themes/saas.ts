import type { ThemeConfig } from "@/lib/theme"

export const saasTheme: ThemeConfig = {
  id: "saas",
  brand:  { name: "Velo", tagline: "Ship faster. Break less." },
  meta: {
    title:       "Velo — Developer Tools for Modern Teams",
    description: "CI/CD pipelines, error monitoring, and release automation. Built for engineering teams that move fast.",
  },
  colors: {
    accent:      "#6D28D9",
    accentLight: "#7C3AED",
    accentDark:  "#4C1D95",
    background:  "#F5F3FF",
  },
  fonts: { heading: "var(--font-lexend), 'Inter', sans-serif", headingVar: "--font-lexend" },
  hero: {
    headline: "Ship faster. Break less.",
    subline:  "CI/CD pipelines, error monitoring, and release automation — all in one dashboard. Ask me how it works.",
    ctaText:  "Start Free Trial",
    image:    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&q=80",
    imageAlt: "Dashboard with code deployment metrics",
  },
  collections: [
    { name: "CI/CD",       slug: "CICD",       image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80" },
    { name: "Monitoring",  slug: "Monitoring",  image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" },
    { name: "Security",    slug: "Security",    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80" },
    { name: "Analytics",   slug: "Analytics",   image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" },
    { name: "Enterprise",  slug: "Enterprise",  image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80" },
  ],
  shipping: "Free 14-day trial · No credit card required · Cancel anytime",
  aria: {
    name:        "Velo",
    voice:       "Puck",
    personality: "sharp, technically fluent, and a little irreverent — like a senior engineer who actually enjoys onboarding people",
    products:    "starter-plan ($29/mo), growth-plan ($99/mo), team-plan ($299/mo), enterprise-plan (custom), ci-runners-extra ($49/mo), error-monitoring-addon ($19/mo), security-scan-addon ($39/mo), annual-discount (2-months-free)",
    categories:  "CICD, Monitoring, Security, Analytics, Enterprise",
  },
  products: [
    { name: "Starter Plan",           slug: "starter-plan",           description: "1 project, 500 CI minutes/month, basic error monitoring. Perfect for solo devs.",         price: 29.00,  category: "CICD",      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", stockCount: 999 },
    { name: "Growth Plan",            slug: "growth-plan",            description: "10 projects, 5,000 CI minutes, full error monitoring, Slack & GitHub integration.",        price: 99.00,  category: "CICD",      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", stockCount: 999 },
    { name: "Team Plan",              slug: "team-plan",              description: "Unlimited projects, 20,000 CI minutes, role-based access, priority support.",               price: 299.00, category: "CICD",      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", stockCount: 999 },
    { name: "Enterprise Plan",        slug: "enterprise-plan",        description: "Custom CI runners, SSO, SLA guarantees, dedicated account manager. Contact us.",           price: 999.00, category: "Enterprise", image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80", stockCount: 999 },
    { name: "Extra CI Runners",       slug: "ci-runners-extra",       description: "Add 5,000 additional CI minutes per month to any plan.",                                   price: 49.00,  category: "CICD",      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", stockCount: 999 },
    { name: "Error Monitoring Add-on",slug: "error-monitoring-addon", description: "Real-time error tracking, stack traces, release health dashboards.",                       price: 19.00,  category: "Monitoring", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80", stockCount: 999 },
    { name: "Security Scan Add-on",   slug: "security-scan-addon",    description: "Automated dependency vulnerability scanning and SAST on every PR.",                       price: 39.00,  category: "Security",   image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80", stockCount: 999 },
    { name: "Annual Discount",        slug: "annual-discount",        description: "Pay annually on any plan and get 2 months free — 17% off the monthly price.",              price: 0.00,   category: "Enterprise", image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80", stockCount: 999 },
  ],
  about: {
    story: "Velo was built by engineers who got tired of duct-taping four different DevOps tools together. The founders previously ran infrastructure at companies that grew from 10 to 10,000 engineers — so they know what breaks at scale and why. The product is opinionated because the team has seen what happens when it isn't.",
    values: [
      { title: "No bloat",       desc: "Every feature ships with a removal path. If we'd delete it in a year, we don't build it now." },
      { title: "Zero magic",     desc: "Every pipeline step is visible, logged, and reproducible. Black boxes break at the worst times." },
      { title: "Devs first",     desc: "The pricing page is honest. The docs are written by the engineers who built the features." },
    ],
    team: [
      { name: "Priya Sharma",   role: "CEO & Co-founder",        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80" },
      { name: "Luca De Martini",role: "CTO & Co-founder",        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80" },
      { name: "Aiko Watanabe",  role: "Head of Developer Exp.",  image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" },
    ],
  },
}
