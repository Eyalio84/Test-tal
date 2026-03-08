# StoreKit Developer Tools Reference

This directory contains reference documentation for every developer tool
in the StoreKit stack. Each file covers: what the tool is, why it's here,
how it's configured, and common usage patterns with actual code examples.

## Index

| File | Tool | Purpose |
|------|------|---------|
| [env.md](env.md) | @t3-oss/env-nextjs | Type-safe environment variables |
| [zod.md](zod.md) | Zod | Input validation for API routes |
| [biome.md](biome.md) | Biome | Linting and code formatting |
| [sharp.md](sharp.md) | Sharp | Image compression before R2 upload |
| [sentry.md](sentry.md) | Sentry | Error monitoring and alerting |
| [vitest.md](vitest.md) | Vitest | Unit test runner |
| [tanstack-query.md](tanstack-query.md) | TanStack Query | Server state management |
| [image-scout.md](image-scout.md) | Image Scout | AI-powered image sourcing agent |

## Quick Reference: Where each tool is configured

| Tool | Config file |
|------|------------|
| @t3-oss/env-nextjs | `env.ts` (project root) |
| Zod | `lib/validations.ts` |
| Biome | `biome.json` (project root) |
| Sharp | `lib/compress.ts` |
| Sentry | `sentry.*.config.ts` + `instrumentation.ts` |
| Vitest | `vitest.config.ts` + `tests/` |
| TanStack Query | `components/layout/Providers.tsx` |
| Image Scout | `scripts/image-scout.ts` + `scripts/image-scout-prompt.ts` |

## Pre-launch checklist (not yet installed)

When you have real users, add these — see CLAUDE.md for full context:

- **Upstash Redis** — rate limiting for `/api/media/upload` and Gemini calls
- **PostHog** — product analytics (which themes get demoed, which commands are used)
- **Trigger.dev** — background jobs (image migration, email sequences)

## Post-launch checklist

- **Prisma Accelerate** — connection pooling + query caching for Neon serverless
- **Axiom** — structured log aggregation (replace console.log at scale)
- **shadcn/ui** — accessible component library (migrate admin UI)
