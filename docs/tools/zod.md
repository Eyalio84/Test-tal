# Zod — API Input Validation

## What it is

A TypeScript-first schema validation library. You define the shape of data
you expect, call `.parse()` or `.safeParse()`, and get back either a typed
result or a structured error. The TypeScript types are inferred automatically
from the schema — no duplication.

## Why it's in StoreKit

API routes receive raw user input. Without validation, a malicious request
could pass `themeId: "../../etc/passwd"` or `slot: "; DROP TABLE ThemeImage"`.
Zod catches these at the boundary — before they touch the database.

## Config file

`lib/validations.ts` — all schemas for StoreKit's API routes live here.

## Current schemas

### uploadSchema
Used in `POST /api/media/upload`:

```ts
export const uploadSchema = z.object({
  themeId: z.enum(THEME_IDS as [string, ...string[]]),
  slot:    z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  alt:     z.string().max(256).optional().default(""),
})
```

### querySchema (inline)
Used in `GET /api/media/images`:

```ts
const querySchema = z.object({
  themeId: z.enum(THEME_IDS as [string, ...string[]]),
})
```

## Usage patterns

### safeParse (recommended for API routes)
Does not throw — returns `{ success, data, error }`:

```ts
const parsed = uploadSchema.safeParse(rawInput)
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
}
const { themeId, slot, alt } = parsed.data  // fully typed
```

### parse (throws on failure — use in scripts/tests)
```ts
const data = uploadSchema.parse(rawInput)  // throws ZodError if invalid
```

## Adding a new schema

Add it to `lib/validations.ts`:

```ts
export const newApiSchema = z.object({
  name:  z.string().min(1).max(100),
  price: z.number().positive(),
  tags:  z.array(z.string()).max(5).optional(),
})

export type NewApiInput = z.infer<typeof newApiSchema>  // extract the TypeScript type
```

## Common Zod validators

| Validator | What it does |
|-----------|-------------|
| `z.string()` | Any string |
| `z.string().min(1)` | Non-empty string |
| `z.string().email()` | Valid email format |
| `z.string().url()` | Valid URL |
| `z.string().regex(/pattern/)` | Must match regex |
| `z.number().positive()` | Number > 0 |
| `z.number().int()` | Integer only |
| `z.enum(["a","b","c"])` | Must be one of these exact values |
| `z.array(z.string())` | Array of strings |
| `.optional()` | Field can be absent |
| `.default("value")` | Use this if absent |
| `.nullable()` | Can be null |
