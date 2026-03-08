# Sentry — Error Monitoring

## What it is

A platform that captures every unhandled error in your application (both
server and browser), records the full stack trace, the user's session, and
the exact request that caused it, then sends you an alert.

## Why it's in StoreKit

Without Sentry, you only discover errors when a user complains. With Sentry,
you know about errors before users report them — including errors in the
Aria WebSocket connection, the Stripe webhook handler, or the R2 upload pipeline.

## Config files

| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Browser error capture |
| `sentry.server.config.ts` | Node.js server error capture |
| `sentry.edge.config.ts` | Edge runtime error capture |
| `instrumentation.ts` | Next.js hook that loads the correct config |

## Key config choice: `enabled: process.env.NODE_ENV === "production"`

Sentry is intentionally disabled in local development. This means:
- Dev errors show in your terminal as normal
- You won't generate noise in your Sentry dashboard during development
- It activates automatically when deployed to production

## Environment variable

`SENTRY_DSN` is defined as optional in `env.ts`:
```ts
SENTRY_DSN: z.string().url().optional(),
```
This means the app starts without it in dev. In production, add it to your
deployment environment variables.

## Dashboard

Go to https://sentry.io → your project → Issues. Each error shows:
- Stack trace with line numbers
- User information (if logged in)
- The HTTP request that triggered it
- How many times it's happened
- Whether it's new or recurring

## Source maps (for readable stack traces in production)

Add to your deployment environment:
```
SENTRY_AUTH_TOKEN=your_token_here
```
(Get from Sentry → Settings → Auth Tokens)

Then in `next.config.ts`, remove `sourcemaps: { disable: true }`.

## Manually capturing errors

In catch blocks where you want Sentry to know but don't want to crash:

```ts
import * as Sentry from "@sentry/nextjs"

try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error)
  // handle gracefully
}
```

## Adding context to errors

```ts
Sentry.setTag("themeId", themeId)
Sentry.setUser({ email: session.user.email })
```

This appears in the Sentry dashboard alongside the error.
