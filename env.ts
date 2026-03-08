import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Server-side variables — never sent to the browser.
   * All MUST be present or the server will refuse to start.
   */
  server: {
    DATABASE_URL:                  z.string().url(),
    NEXTAUTH_SECRET:               z.string().min(1),
    GOOGLE_CLIENT_ID:              z.string().min(1),
    GOOGLE_CLIENT_SECRET:          z.string().min(1),
    ADMIN_EMAIL:                   z.string().email(),
    STRIPE_SECRET_KEY:             z.string().startsWith("sk_"),
    STRIPE_WEBHOOK_SECRET:         z.string().optional(),
    STRIPE_PRICE_BASIC:            z.string().startsWith("price_"),
    STRIPE_PRICE_BUILDER:          z.string().startsWith("price_"),
    STRIPE_PRICE_PRO:              z.string().startsWith("price_"),
    GEMINI_API_KEY:                z.string().min(1),
    CLOUDFLARE_ACCOUNT_ID:         z.string().min(1),
    CLOUDFLARE_R2_ACCESS_KEY_ID:   z.string().min(1),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
    CLOUDFLARE_R2_BUCKET_NAME:     z.string().min(1),
    CLOUDFLARE_R2_PUBLIC_URL:      z.string().url(),
    PEXEL_API_KEY:                 z.string().min(1),
    SENTRY_DSN:                    z.string().url().optional(),
  },

  /**
   * Client-side variables — prefixed with NEXT_PUBLIC_, sent to the browser.
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
    NEXT_PUBLIC_SITE_URL:               z.string().url(),
    NEXT_PUBLIC_GEMINI_API_KEY:         z.string().min(1),
    NEXT_PUBLIC_WHATSAPP_NUMBER:        z.string().min(1),
    NEXT_PUBLIC_THEME:                  z.string().optional(),
  },

  /**
   * Manual mapping — every variable listed above must appear here.
   * This is the bridge between process.env and the typed env object.
   */
  runtimeEnv: {
    DATABASE_URL:                       process.env.DATABASE_URL,
    NEXTAUTH_SECRET:                    process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID:                   process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:               process.env.GOOGLE_CLIENT_SECRET,
    ADMIN_EMAIL:                        process.env.ADMIN_EMAIL,
    STRIPE_SECRET_KEY:                  process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:              process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_BASIC:                 process.env.STRIPE_PRICE_BASIC,
    STRIPE_PRICE_BUILDER:               process.env.STRIPE_PRICE_BUILDER,
    STRIPE_PRICE_PRO:                   process.env.STRIPE_PRICE_PRO,
    GEMINI_API_KEY:                     process.env.GEMINI_API_KEY,
    CLOUDFLARE_ACCOUNT_ID:              process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_R2_ACCESS_KEY_ID:        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY:    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_R2_BUCKET_NAME:          process.env.CLOUDFLARE_R2_BUCKET_NAME,
    CLOUDFLARE_R2_PUBLIC_URL:           process.env.CLOUDFLARE_R2_PUBLIC_URL,
    PEXEL_API_KEY:                      process.env.PEXEL_API_KEY,
    SENTRY_DSN:                         process.env.SENTRY_DSN,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL:               process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GEMINI_API_KEY:         process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_WHATSAPP_NUMBER:        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_THEME:                  process.env.NEXT_PUBLIC_THEME,
  },
})
