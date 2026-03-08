import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // How much of errors to send — 1.0 = 100%, fine for low-traffic apps
  tracesSampleRate: 1.0,

  // Only run in production — never in local dev
  enabled: process.env.NODE_ENV === "production",
})
