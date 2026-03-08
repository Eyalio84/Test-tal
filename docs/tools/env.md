# @t3-oss/env-nextjs — Type-safe Environment Variables

## What it is

A wrapper around Zod that validates all environment variables at server startup.
If any required variable is missing or has the wrong format, the server refuses
to start and prints exactly which variable failed — instead of crashing later
with a confusing error deep in the code.

## Why it's in StoreKit

Before this: `process.env.CLOUDFLARE_ACCOUNT_ID!` — the `!` tells TypeScript
"trust me, this is defined," but TypeScript can't verify it. If the variable is
missing, the app crashes when R2 tries to connect, not at startup.

After this: if `CLOUDFLARE_ACCOUNT_ID` is missing, you see:
```
❌ Invalid environment variables:
  CLOUDFLARE_ACCOUNT_ID: Required
```
...on line 1 of the server log, before any request is handled.

## Config file

`env.ts` at the project root.

## Structure

```ts
export const env = createEnv({
  server: {
    // Variables that must NEVER reach the browser
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  },
  client: {
    // Variables that are safe to expose to the browser (NEXT_PUBLIC_ prefix)
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  },
  runtimeEnv: {
    // Manual bridge: every variable above must be listed here
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
})
```

## Usage

```ts
import { env } from "@/env"

// Instead of:              process.env.STRIPE_SECRET_KEY!
// Use:                     env.STRIPE_SECRET_KEY
// TypeScript type:         string (guaranteed non-null)
```

## Adding a new environment variable

1. Add the variable + Zod schema to `server` or `client` in `env.ts`
2. Add the mapping to `runtimeEnv`
3. Add the actual value to `.env.local`

That's it — TypeScript will now error anywhere you forget to set it.

## Key Zod validators used in StoreKit

| Validator | What it checks |
|-----------|---------------|
| `z.string().url()` | Must be a valid URL (DATABASE_URL, R2_PUBLIC_URL) |
| `z.string().startsWith("sk_")` | Stripe secret key format |
| `z.string().startsWith("pk_")` | Stripe public key format |
| `z.string().email()` | Email address (ADMIN_EMAIL) |
| `z.string().optional()` | Variable can be absent (STRIPE_WEBHOOK_SECRET in dev) |
| `z.string().min(1)` | Must exist and be non-empty |

## Note for scripts

Scripts (`scripts/*.ts`) must have `import "dotenv/config"` as the **first** import.
This loads `.env.local` before `env.ts` validation runs. Without it, the env
check fires before environment variables are available and the script crashes.
