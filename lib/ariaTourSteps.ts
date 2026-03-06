import type { TourStep } from "@/store/aria"

export const STORE_TOUR: TourStep[] = [
  {
    url:         "/",
    title:       "Hey Tal — Welcome",
    description: "Eyal built this entire store — from zero — to show you what's possible when there's no ceiling on ambition.",
    narration:   "Tal! I'm Aria. Eyal built me — and everything you're about to see — as a personal demo just for you. What you're looking at is a full-stack luxury e-commerce platform, built from scratch. And I'm going to take you through every layer of it. Ready? Let's go.",
  },
  {
    url:         "/products",
    title:       "The Shop — Server-Rendered, Voice-Powered",
    description: "Eight handcrafted products. Real data from a Prisma ORM database. Filter by category or price — by voice or tap. All server-rendered in Next.js 16.",
    narration:   "This is the shop. Eight handcrafted jewelry pieces — every one of them lives in a real database, with stock levels, categories, slugs, and pricing. The page is server-rendered in Next.js 16, using Prisma ORM talking to SQLite. You can filter by category, filter by price, or search by name — and I can do all of that by voice. Try saying 'show me rings' any time.",
  },
  {
    url:         "/products/sapphire-statement-ring",
    title:       "Product Detail — Full Stack",
    description: "Image gallery, dynamic routing, add to cart, stock-aware UI, recently viewed strip, related products — all wired together.",
    narration:   "Product detail page. Dynamic routing with SEO-friendly slugs. Image gallery, stock-aware add-to-cart button, a recently-viewed strip that persists across sessions, and related products pulled by category. I know this product — ask me to describe it or check if it's in stock any time. This page also injects data into the DOM so I can narrate whatever's on screen.",
  },
  {
    url:         "/collections",
    title:       "Collections — Pure Server Components",
    description: "Five categories. Zero client JavaScript on the page itself. Server components at full speed.",
    narration:   "Collections. Five jewelry categories, each linking to a filtered product view. This entire page is a React server component — zero client JavaScript shipped for the page itself. That means instant load, perfect SEO, no hydration cost. Eyal uses Next.js the way it was designed to be used.",
  },
  {
    url:         "/about",
    title:       "Editorial Design — DB-Driven Content",
    description: "Story, team, values — all content stored in the database. In production, an AI editor lets the client update copy by chatting.",
    narration:   "The about page. Editorial design — story section, values, team. But here's the interesting part: all the copy is stored in the database under a SiteContent model. In a full build, Eyal wires this to an AI chat interface so the client can update their own website just by talking to it. No CMS license, no page builders — just conversation.",
  },
  {
    url:         "/contact",
    title:       "Contact — Real Email Delivery",
    description: "Form validation, server API route, real email via Resend. Works in dev without an API key — logs to console.",
    narration:   "Contact form. Not a fake one — it sends real email through Resend, a modern email delivery service. The backend validates every field, handles errors gracefully, and sends toast notifications. In dev mode, without an API key, it logs to the console and still returns success so development is never blocked. Small detail — big quality signal.",
  },
  {
    url:         "/cart",
    title:       "The Cart — Zustand + Voice",
    description: "Zustand state, localStorage persistence, synced across tabs. I can read your cart, add items, and open it — all by voice.",
    narration:   "The cart. Built on Zustand state management with localStorage persistence — your cart survives page refreshes, tab switches, everything. I'm fully wired into it. Say 'read my cart' and I'll tell you exactly what's in there and the total. Say 'add the pearl earrings' from anywhere in the store — done. The whole experience is voice-first.",
  },
  {
    url:         "/admin",
    title:       "Admin Dashboard — Auth-Protected",
    description: "NextAuth v5 Google OAuth guards this route. Real order stats, revenue, and recent orders — live from the database.",
    narration:   "The admin dashboard. Protected by NextAuth version five, using Google OAuth — you'd need to sign in to access it for real. Behind the lock: live order stats, total revenue, paid order count, product count, and a recent orders table — all pulled directly from Prisma at request time. No caching, no stale data. The store is ready for real transactions the moment Stripe keys go in.",
  },
  {
    url:         "/",
    selector:    "[aria-label='Open assistant menu']",
    title:       "And That's Just the Start ✦",
    description: "Frontend. Backend. Auth. Payments-ready. Voice AI. Email. Admin. All from scratch. This is what Eyal builds.",
    narration:   "And Tal — that's the tour. Frontend, backend, database, authentication, email, voice AI, admin dashboard, payments-ready Stripe integration — built from scratch, in days. This is what Eyal does. And honestly? What you just saw is the tip of the iceberg. When Eyal builds, the only real boundary is imagination. And even that keeps moving.",
  },
]
