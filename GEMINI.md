# StoreKit — Gemini CLI Context

This project, **StoreKit**, is a voice-AI website builder platform. It allows merchants to build and edit e-commerce stores using a Gemini-powered voice assistant named **Aria**.

## Project Overview

- **Purpose:** A SaaS platform for launching themed e-commerce stores editable via voice or mouse.
- **Core AI:** **Aria**, a Gemini Live WebSocket assistant (`gemini-2.5-flash-native-audio-preview`).
- **Key Features:**
  - 8 production-ready store themes (jewelry, candy, bakery, etc.).
  - **Aria Voice AI:** Real-time editing, navigation, and shopping assistance.
  - **Session Report Pad:** Structured test notes and session summaries written by Aria.
  - **Image Scout:** AI-powered image curation (Pexels/Gemini → R2 CDN).
  - **Stripe Checkout:** Full end-to-end payment flow.
  - **Multi-tenant:** Isolated `Site` records per user.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Database** | Neon PostgreSQL + Prisma v5 + `pgvector` |
| **Auth** | NextAuth v5 (Google OAuth) |
| **Voice AI** | Gemini Live API (WebSocket) |
| **Embeddings** | Gemini `gemini-embedding-001` |
| **Storage** | Cloudflare R2 (S3-compatible) |
| **Payments** | Stripe Checkout + Webhooks |
| **State** | Zustand v5 (Aria, Cart, Canvas, etc.) |
| **Styling** | Tailwind CSS v4 |
| **Linting** | Biome v2 |
| **Testing** | Vitest |

## Building and Running

### Prerequisites
- Node.js 20+
- PostgreSQL with `pgvector` (e.g., Neon)
- Google OAuth, Stripe, Cloudflare R2, Gemini, and Pexels API keys.

### Commands
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local # Fill in values

# Database setup
npx prisma db push
# Enable pgvector in your DB:
# CREATE EXTENSION IF NOT EXISTS vector;
# ALTER TABLE "CdnImage" ADD COLUMN IF NOT EXISTS embedding vector(768);

# Seed data
npx prisma db seed

# Run development server
npm run dev # Port 3000
```

## Development Conventions

### Standards & Safety
- **Validation:** All API inputs MUST be validated with Zod in `lib/validations.ts`.
- **Environment:** Always use `env.ts` (T3 Env) instead of raw `process.env`.
- **Images:** Use `lib/compress.ts` (Sharp) before R2 upload. All CDN URLs should be generated via `lib/r2.ts` helpers.
- **Server State:** Use TanStack Query for DB-fetched data on the client.
- **Architecture:** `force-dynamic` for all pages; no static caching to ensure real-time AI updates.

### Pre-commit Checklist
Run these before any commit to ensure stability:
1. `npx tsc --noEmit` (TypeScript check)
2. `npm test` (Vitest unit tests)
3. `npm run lint` (Biome linting)

### Key Files & Directories
- `app/`: Next.js App Router (Pages & APIs).
- `components/`: UI components organized by domain.
- `hooks/useAriaLive.ts`: Core Gemini Live WebSocket logic and command dispatcher.
- `lib/`: Shared utilities (auth, db, r2, theme resolution).
- `store/`: Zustand state management.
- `themes/`: Static theme configurations and product catalogs.
- `prisma/schema.prisma`: Database source of truth.

## Aria Contexts
Aria operates in three distinct modes:
1. **Platform:** Warm guide on the homepage; knows about templates and pricing.
2. **Template:** Shopping assistant; handles `add_to_cart`, `navigate_to_product`, and product descriptions.
3. **Member:** Owner's runtime assistant; handles site editing (`set_hero_text`, `set_color`), admin navigation, and session reporting.

## Core Mandates
- **Surgical Edits:** When modifying site content, prioritize the `SiteContent` table (draft/live workflow).
- **Theme Integrity:** Never modify `themes/*.ts` directly for user-specific changes; use `ThemeImage` overrides in the database.
- **Aria Updates:** When adding capabilities, update `lib/ariaChangelog.ts` so Aria knows her new skills.
