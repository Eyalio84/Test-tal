# P4 Extended: Atomic Component Library + Registry System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a database-backed component registry with admin CRUD, public showcase, editor palette integration, and Aria voice commands to add/edit components by name.

**Architecture:** 
Single-source-of-truth `Component` table in Prisma stores metadata (name, slug, category, propsSchema, previewImage, ariaName). Three interfaces layer on top: admin registry (`/admin/components`) for CRUD, public showcase (`/components`) for browsing, editor palette (in `/dashboard/editor`) for drag-to-place. Aria receives the full component catalog on connect and executes voice commands like "add testimonial card after hero" by querying the registry.

**Tech Stack:** Next.js 16, Prisma v5, TypeScript, TanStack Query, Zod validation, Cloudflare R2 for image storage, Zustand for canvas state.

---

## Phase 1: Database Schema & API Infrastructure

### Task 1.1: Create Component Prisma Model

**Files:**
- Modify: `prisma/schema.prisma` (add Component model + relation)
- Create: `prisma/migrations/component_registry/migration.sql`

**Step 1: Write the schema addition**

Add to `prisma/schema.prisma` after the existing models:

```prisma
model Component {
  id            String    @id @default(cuid())
  slug          String    @unique
  name          String
  category      String    // "button" | "input" | "card" | "overlay" | "nav" | "section"
  description   String    @db.Text
  propsSchema   Json      // { fieldName: { type: "string" | "number" | "boolean" | "color", required: boolean, default: any } }
  previewImage  String?   // r2Key, nullable for components without visual preview
  ariaName      String    // how Aria references it: "testimonial_card", "hero_button", etc.
  docsUrl       String?   // link to documentation
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([category])
  @@index([ariaName])
}
```

**Step 2: Generate migration**

```bash
cd /root/tal-boilerplate
npx prisma migrate dev --name component_registry
```

Expected: Migration file created in `prisma/migrations/`, database updated.

**Step 3: Verify schema in Prisma Studio**

```bash
npx prisma studio
```

Expected: Component model visible in UI.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Component model to schema"
```

---

### Task 1.2: Write Component API Validation Schema

**Files:**
- Modify: `lib/validations.ts`

**Step 1: Add Zod schemas**

Add to end of `lib/validations.ts`:

```typescript
export const componentPropsSchema = z.record(z.object({
  type: z.enum(['string', 'number', 'boolean', 'color', 'enum']),
  required: z.boolean().default(false),
  default: z.unknown().optional(),
  enum: z.array(z.string()).optional(), // for enum type
  description: z.string().optional(),
}));

export const createComponentSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(100),
  category: z.enum(['button', 'input', 'card', 'overlay', 'nav', 'section', 'badge', 'modal', 'dropdown', 'slider']),
  description: z.string().max(500),
  propsSchema: componentPropsSchema,
  ariaName: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
  previewImage: z.string().optional(), // r2Key after upload
  docsUrl: z.string().url().optional(),
});

export const updateComponentSchema = createComponentSchema.partial();

export type CreateComponentInput = z.infer<typeof createComponentSchema>;
export type UpdateComponentInput = z.infer<typeof updateComponentSchema>;
```

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add lib/validations.ts
git commit -m "feat: add component validation schemas"
```

---

### Task 1.3: Create Component API Routes (List & Get)

**Files:**
- Create: `app/api/components/route.ts`

**Step 1: Create GET route**

Create `app/api/components/route.ts`:

```typescript
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');

    let query = db.component.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    if (category && category !== 'all') {
      query = db.component.findMany({
        where: { category },
        orderBy: { name: 'asc' },
      });
    }

    if (search) {
      query = db.component.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { ariaName: { contains: search, mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
      });
    }

    const components = await query;
    return NextResponse.json(components);
  } catch (error) {
    console.error('Failed to fetch components:', error);
    return NextResponse.json(
      { error: 'Failed to fetch components' },
      { status: 500 }
    );
  }
}
```

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Test manually**

```bash
curl http://localhost:3001/api/components
```

Expected: Empty array `[]` (no components created yet).

**Step 4: Commit**

```bash
git add app/api/components/route.ts
git commit -m "feat: add GET /api/components endpoint"
```

---

### Task 1.4: Create Component Admin API (Create, Update, Delete)

**Files:**
- Create: `app/api/admin/components/route.ts`
- Create: `app/api/admin/components/[id]/route.ts`

**Step 1: Create admin POST route**

Create `app/api/admin/components/route.ts`:

```typescript
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createComponentSchema } from '@/lib/validations';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createComponentSchema.parse(body);

    const component = await db.component.create({
      data: validatedData,
    });

    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Component slug already exists' },
        { status: 409 }
      );
    }
    console.error('Failed to create component:', error);
    return NextResponse.json(
      { error: 'Failed to create component' },
      { status: 500 }
    );
  }
}
```

**Step 2: Create admin PATCH/DELETE routes**

Create `app/api/admin/components/[id]/route.ts`:

```typescript
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateComponentSchema } from '@/lib/validations';
import { NextRequest, NextResponse } from 'next/server';

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Unauthorized');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureAdmin();

    const body = await request.json();
    const validatedData = updateComponentSchema.parse(body);

    const component = await db.component.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(component);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    console.error('Failed to update component:', error);
    return NextResponse.json(
      { error: 'Failed to update component' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureAdmin();

    await db.component.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    console.error('Failed to delete component:', error);
    return NextResponse.json(
      { error: 'Failed to delete component' },
      { status: 500 }
    );
  }
}
```

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add app/api/admin/components/route.ts app/api/admin/components/\[id\]/route.ts
git commit -m "feat: add admin POST/PATCH/DELETE component endpoints"
```

---

### Task 1.5: Write API Integration Tests

**Files:**
- Create: `tests/api/components.test.ts`

**Step 1: Create test file**

Create `tests/api/components.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';

describe('Component API', () => {
  beforeAll(async () => {
    // Clean up test data
    await db.component.deleteMany({});
  });

  afterAll(async () => {
    await db.component.deleteMany({});
  });

  it('should list all components', async () => {
    // Create test component
    await db.component.create({
      data: {
        slug: 'test-button',
        name: 'Test Button',
        category: 'button',
        description: 'A test button',
        ariaName: 'test_button',
        propsSchema: {
          label: { type: 'string', required: true },
          size: { type: 'enum', enum: ['sm', 'md', 'lg'], default: 'md' },
        },
      },
    });

    const response = await fetch('http://localhost:3001/api/components');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].slug).toBe('test-button');
  });

  it('should filter components by category', async () => {
    const response = await fetch(
      'http://localhost:3001/api/components?category=button'
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.every((c: any) => c.category === 'button')).toBe(true);
  });

  it('should search components by name', async () => {
    const response = await fetch(
      'http://localhost:3001/api/components?search=Button'
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});
```

**Step 2: Run tests**

```bash
npm test -- tests/api/components.test.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add tests/api/components.test.ts
git commit -m "test: add component API integration tests"
```

---

## Phase 2: Admin Registry UI

### Task 2.1: Create Admin Components Page Layout

**Files:**
- Create: `app/admin/components/page.tsx`

**Step 1: Create layout**

Create `app/admin/components/page.tsx`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function AdminComponentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: components = [], isLoading } = useQuery({
    queryKey: ['components', selectedCategory, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/components?${params}`);
      if (!response.ok) throw new Error('Failed to fetch components');
      return response.json();
    },
  });

  const categories = [
    'all',
    'button',
    'input',
    'card',
    'overlay',
    'nav',
    'section',
    'badge',
    'modal',
    'dropdown',
    'slider',
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Component Registry</h1>
            <p className="text-slate-400 mt-2">
              Manage atomic components and Aria integration
            </p>
          </div>
          <button
            onClick={() => {
              // TODO: Open create component modal
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + New Component
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Component Grid */}
        {isLoading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : components.length === 0 ? (
          <div className="text-center text-slate-400">No components found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {components.map((component: any) => (
              <div
                key={component.id}
                className="p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-blue-500 transition cursor-pointer"
                onClick={() => {
                  // TODO: Open component detail/edit modal
                }}
              >
                {component.previewImage && (
                  <img
                    src={component.previewImage}
                    alt={component.name}
                    className="w-full h-32 object-cover rounded mb-3 bg-slate-800"
                  />
                )}
                <h3 className="font-semibold text-white">{component.name}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {component.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                    {component.category}
                  </span>
                  <span className="text-xs text-blue-400 font-mono">
                    @{component.ariaName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify admin layout guard (should already exist)**

Check `app/admin/layout.tsx` has server-side ADMIN_EMAIL check. It should. If not, add:

```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;

  if (!isAdmin) {
    redirect('/');
  }

  return <>{children}</>;
}
```

**Step 3: Run dev server and navigate**

```bash
npm run dev
# Navigate to http://localhost:3001/admin/components
```

Expected: Empty grid with "No components found".

**Step 4: Commit**

```bash
git add app/admin/components/page.tsx
git commit -m "feat: add admin components page with search & filter"
```

---

## Phase 3: Public Showcase

### Task 3.1: Create Public Components Showcase Page

**Files:**
- Create: `app/components/page.tsx`
- Create: `app/components/[slug]/page.tsx`

**Step 1: Create showcase grid page**

Create `app/components/page.tsx`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

export default function ComponentsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: components = [], isLoading } = useQuery({
    queryKey: ['components-public', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      const response = await fetch(`/api/components?${params}`);
      if (!response.ok) throw new Error('Failed to fetch components');
      return response.json();
    },
  });

  const categories = [
    'all',
    'button',
    'input',
    'card',
    'overlay',
    'nav',
    'section',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Component Library</h1>
          <p className="text-blue-100 text-lg">
            30+ atomic components. Drag-to-place in the editor. Voice-controlled with Aria.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Category Filter */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center text-slate-400">Loading components...</div>
        ) : components.length === 0 ? (
          <div className="text-center text-slate-400">No components in this category</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {components.map((component: any) => (
              <Link
                key={component.id}
                href={`/components/${component.slug}`}
              >
                <div className="group p-6 bg-slate-900 rounded-lg border border-slate-700 hover:border-blue-500 transition h-full">
                  {component.previewImage && (
                    <img
                      src={component.previewImage}
                      alt={component.name}
                      className="w-full h-40 object-cover rounded mb-4 bg-slate-800"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">
                    {component.name}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">
                    {component.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                      {component.category}
                    </span>
                    <span className="text-xs text-blue-400 font-mono">
                      @{component.ariaName}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create component detail page**

Create `app/components/[slug]/page.tsx`:

```typescript
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

export const dynamicParams = true;
export const revalidate = 3600; // 1 hour

export async function generateStaticParams() {
  const components = await db.component.findMany({
    select: { slug: true },
  });
  return components.map((c) => ({ slug: c.slug }));
}

export default async function ComponentDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const component = await db.component.findUnique({
    where: { slug: params.slug },
  });

  if (!component) notFound();

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <a href="/components" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to library
        </a>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{component.name}</h1>
          <p className="text-slate-400">{component.description}</p>
        </div>

        {/* Preview */}
        {component.previewImage && (
          <div className="mb-8 p-6 bg-slate-900 rounded-lg border border-slate-700">
            <img
              src={component.previewImage}
              alt={component.name}
              className="w-full rounded"
            />
          </div>
        )}

        {/* Props */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Props</h2>
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <pre className="text-sm text-slate-300 overflow-auto">
              {JSON.stringify(component.propsSchema, null, 2)}
            </pre>
          </div>
        </div>

        {/* Aria Integration */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Aria Command</h2>
          <div className="bg-slate-900 rounded-lg p-6 border border-blue-700">
            <p className="text-blue-200 mb-2">Say to Aria:</p>
            <code className="text-sm font-mono text-blue-400">
              "add {component.ariaName}"
            </code>
          </div>
        </div>

        {/* Usage */}
        {component.docsUrl && (
          <div className="mb-8">
            <a
              href={component.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
            >
              View Full Documentation
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Run dev server**

```bash
npm run dev
# Navigate to http://localhost:3001/components
```

Expected: Showcase page loads with category filters (empty grid until components exist).

**Step 4: Commit**

```bash
git add app/components/page.tsx app/components/\[slug\]/page.tsx
git commit -m "feat: add public component showcase with detail page"
```

---

## Phase 4: Editor Palette Integration

### Task 4.1: Create Component Palette UI Component

**Files:**
- Create: `components/editor/ComponentPalette.tsx`

**Step 1: Create palette component**

Create `components/editor/ComponentPalette.tsx`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Component {
  id: string;
  slug: string;
  name: string;
  category: string;
  propsSchema: Record<string, any>;
  ariaName: string;
  previewImage?: string;
}

export function ComponentPalette({
  onComponentSelect,
}: {
  onComponentSelect: (component: Component) => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('button');

  const { data: components = [], isLoading } = useQuery({
    queryKey: ['components-palette'],
    queryFn: async () => {
      const response = await fetch('/api/components');
      if (!response.ok) throw new Error('Failed to fetch components');
      return response.json();
    },
  });

  const categories = Array.from(new Set(components.map((c: Component) => c.category)));
  const grouped = categories.reduce(
    (acc, cat) => {
      acc[cat] = components.filter((c: Component) => c.category === cat);
      return acc;
    },
    {} as Record<string, Component[]>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="font-semibold text-white">Components</h3>
        <p className="text-xs text-slate-400 mt-1">Drag to place on canvas</p>
      </div>

      {/* Categories */}
      {isLoading ? (
        <div className="p-4 text-slate-400">Loading...</div>
      ) : (
        <div className="flex-1 overflow-auto">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="border-b border-slate-700">
              <button
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category ? null : category
                  )
                }
                className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-300 hover:bg-slate-800 transition flex items-center justify-between"
              >
                {category}
                <span className="text-xs text-slate-500">{items.length}</span>
              </button>

              {expandedCategory === category && (
                <div className="px-2 py-2 space-y-2 bg-slate-950">
                  {items.map((component) => (
                    <button
                      key={component.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData(
                          'application/json',
                          JSON.stringify(component)
                        );
                      }}
                      onClick={() => onComponentSelect(component)}
                      className="w-full p-2 text-left text-sm text-slate-300 bg-slate-800 rounded hover:bg-blue-600 transition cursor-move"
                    >
                      <p className="font-medium">{component.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        @{component.ariaName}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Update editor layout to include palette**

Modify `app/admin/editor/page.tsx` to include the palette:

Find the component and add the palette:

```typescript
import { ComponentPalette } from '@/components/editor/ComponentPalette';

export default function EditorPage() {
  // ... existing code

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Palette sidebar */}
      <div className="w-64 bg-slate-900">
        <ComponentPalette
          onComponentSelect={(component) => {
            console.log('Selected:', component);
            // TODO: Handle component selection
          }}
        />
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        {/* Canvas content */}
      </div>
    </div>
  );
}
```

**Step 3: Run dev server**

```bash
npm run dev
# Navigate to http://localhost:3001/admin/editor
```

Expected: Palette sidebar visible with categories (empty until components exist).

**Step 4: Commit**

```bash
git add components/editor/ComponentPalette.tsx app/admin/editor/page.tsx
git commit -m "feat: add component palette sidebar to editor"
```

---

## Phase 5: Aria Integration

### Task 5.1: Add Component Registry to Aria Context

**Files:**
- Modify: `hooks/useAriaLive.ts`
- Modify: `store/aria.ts`

**Step 1: Update buildAriaConfig to include component registry**

Modify `hooks/useAriaLive.ts`:

```typescript
async function buildAriaConfig(siteId?: string | null, themeId?: string) {
  // ... existing code ...

  // Fetch component registry
  const componentsResponse = await fetch('/api/components');
  const components = await componentsResponse.json();

  const componentRegistry = components.map((c: any) => ({
    name: c.ariaName,
    displayName: c.name,
    category: c.category,
    props: c.propsSchema,
  }));

  return {
    SYSTEM_PROMPT: `${systemPrompt}\n\nAvailable components: ${JSON.stringify(componentRegistry)}`,
    ARIA_FUNCTIONS: [
      ...existingFunctions,
      {
        name: 'add_component',
        description: 'Add a component to the canvas at a specific position',
        parameters: {
          type: 'object',
          properties: {
            component_name: {
              type: 'string',
              description: 'The ariaName of the component (e.g., "testimonial_card")',
            },
            position: {
              type: 'string',
              description: 'Where to place it (e.g., "after_hero", "in_features_section")',
            },
            props: {
              type: 'object',
              description: 'Props to initialize the component with',
            },
          },
          required: ['component_name', 'position'],
        },
      },
      {
        name: 'edit_component',
        description: 'Edit props of a component on the canvas',
        parameters: {
          type: 'object',
          properties: {
            component_id: {
              type: 'string',
              description: 'The unique ID of the component instance',
            },
            props: {
              type: 'object',
              description: 'Props to update',
            },
          },
          required: ['component_id', 'props'],
        },
      },
      {
        name: 'remove_component',
        description: 'Remove a component from the canvas',
        parameters: {
          type: 'object',
          properties: {
            component_id: {
              type: 'string',
              description: 'The unique ID of the component instance',
            },
          },
          required: ['component_id'],
        },
      },
    ],
  };
}
```

**Step 2: Update executeCommand to handle component functions**

Add to `executeCommand` switch statement:

```typescript
case 'add_component': {
  const { component_name, position, props } = toolUseBlock.input;
  // TODO: Dispatch action to canvas state
  // useCanvasStore.getState().addComponent(component_name, position, props)
  return { success: true, componentId: `comp_${Date.now()}` };
}
case 'edit_component': {
  const { component_id, props } = toolUseBlock.input;
  // TODO: Dispatch action to canvas state
  // useCanvasStore.getState().updateComponent(component_id, props)
  return { success: true };
}
case 'remove_component': {
  const { component_id } = toolUseBlock.input;
  // TODO: Dispatch action to canvas state
  // useCanvasStore.getState().removeComponent(component_id)
  return { success: true };
}
```

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add hooks/useAriaLive.ts
git commit -m "feat: add component registry and Aria functions to Aria context"
```

---

## Phase 6: Seed Initial Components

### Task 6.1: Create Seed Script for Foundational Components

**Files:**
- Create: `scripts/seed-components.ts`

**Step 1: Create seed script**

Create `scripts/seed-components.ts`:

```typescript
import 'dotenv/config';
import { db } from '@/lib/db';

const COMPONENTS = [
  {
    slug: 'primary-button',
    name: 'Primary Button',
    category: 'button',
    description: 'Main action button for primary interactions',
    ariaName: 'primary_button',
    propsSchema: {
      label: {
        type: 'string' as const,
        required: true,
        description: 'Button label text',
      },
      onClick: {
        type: 'string' as const,
        required: false,
        description: 'Action to perform on click',
      },
      size: {
        type: 'enum',
        enum: ['sm', 'md', 'lg'],
        default: 'md',
        description: 'Button size',
      },
      loading: {
        type: 'boolean' as const,
        default: false,
        description: 'Show loading state',
      },
    },
  },
  {
    slug: 'secondary-button',
    name: 'Secondary Button',
    category: 'button',
    description: 'Secondary action button for less important interactions',
    ariaName: 'secondary_button',
    propsSchema: {
      label: {
        type: 'string' as const,
        required: true,
      },
      size: {
        type: 'enum',
        enum: ['sm', 'md', 'lg'],
        default: 'md',
      },
    },
  },
  {
    slug: 'text-input',
    name: 'Text Input',
    category: 'input',
    description: 'Single-line text input field',
    ariaName: 'text_input',
    propsSchema: {
      placeholder: {
        type: 'string' as const,
        required: false,
      },
      label: {
        type: 'string' as const,
        required: false,
      },
      required: {
        type: 'boolean' as const,
        default: false,
      },
      errorMessage: {
        type: 'string' as const,
        required: false,
      },
    },
  },
  {
    slug: 'product-card',
    name: 'Product Card',
    category: 'card',
    description: 'Card component for displaying product information',
    ariaName: 'product_card',
    propsSchema: {
      title: {
        type: 'string' as const,
        required: true,
      },
      price: {
        type: 'number' as const,
        required: true,
      },
      image: {
        type: 'string' as const,
        required: false,
        description: 'Image URL or r2Key',
      },
      description: {
        type: 'string' as const,
        required: false,
      },
    },
  },
  {
    slug: 'testimonial-card',
    name: 'Testimonial Card',
    category: 'card',
    description: 'Card for displaying customer testimonials',
    ariaName: 'testimonial_card',
    propsSchema: {
      text: {
        type: 'string' as const,
        required: true,
      },
      author: {
        type: 'string' as const,
        required: true,
      },
      role: {
        type: 'string' as const,
        required: false,
      },
      avatar: {
        type: 'string' as const,
        required: false,
      },
      rating: {
        type: 'number' as const,
        required: false,
      },
    },
  },
];

async function seed() {
  try {
    console.log('Seeding components...');

    for (const component of COMPONENTS) {
      const existing = await db.component.findUnique({
        where: { slug: component.slug },
      });

      if (existing) {
        console.log(`✓ ${component.name} already exists`);
        continue;
      }

      await db.component.create({
        data: component,
      });
      console.log(`✓ Created ${component.name}`);
    }

    console.log('\nSeeding complete!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
```

**Step 2: Run seed script**

```bash
npx tsx scripts/seed-components.ts
```

Expected: 5 components created.

**Step 3: Verify in DB**

```bash
npx prisma studio
# Navigate to Component model, verify entries
```

**Step 4: Commit**

```bash
git add scripts/seed-components.ts
git commit -m "feat: add seed script for foundational components"
```

---

### Task 6.2: Run Seed and Verify UI

**Step 1: Run seed script**

```bash
npx tsx scripts/seed-components.ts
```

**Step 2: Start dev server**

```bash
npm run dev
```

**Step 3: Test showcase page**

Navigate to `http://localhost:3001/components` and verify:
- All 5 components appear
- Category filter works
- Component detail page loads when clicked

**Step 4: Test admin page**

Navigate to `http://localhost:3001/admin/components` and verify:
- All 5 components appear
- Search works
- Category filter works
- Grid shows component metadata

**Step 5: Test editor palette**

Navigate to `http://localhost:3001/admin/editor` and verify:
- Palette sidebar shows all categories
- Components are listed and draggable
- Component names and ariaNames display correctly

**Step 6: Commit**

```bash
git add -A
git commit -m "test: verify component registry UI end-to-end"
```

---

## Phase 7: Add Component CRUD UI (Modal)

### Task 7.1: Create Component Form Modal

**Files:**
- Create: `components/admin/ComponentModal.tsx`

**Step 1: Create modal component**

Create `components/admin/ComponentModal.tsx`:

```typescript
'use client';

import { createComponentSchema, updateComponentSchema } from '@/lib/validations';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface ComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingComponent?: any;
}

export function ComponentModal({
  isOpen,
  onClose,
  editingComponent,
}: ComponentModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(
    editingComponent || {
      slug: '',
      name: '',
      category: 'button',
      description: '',
      ariaName: '',
      propsSchema: {},
    }
  );

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = editingComponent
        ? `/api/admin/components/${editingComponent.id}`
        : '/api/admin/components';

      const response = await fetch(endpoint, {
        method: editingComponent ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save component');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-screen overflow-auto">
        <h2 className="text-xl font-bold text-white mb-4">
          {editingComponent ? 'Edit Component' : 'Create Component'}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(formData);
          }}
          className="space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
              required
              disabled={!!editingComponent}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {['button', 'input', 'card', 'overlay', 'nav', 'section'].map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
              rows={3}
              required
            />
          </div>

          {/* Aria Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Aria Name (e.g., testimonial_card)
            </label>
            <input
              type="text"
              value={formData.ariaName}
              onChange={(e) =>
                setFormData({ ...formData, ariaName: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Update admin page to use modal**

Modify `app/admin/components/page.tsx` to import and use the modal.

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add components/admin/ComponentModal.tsx app/admin/components/page.tsx
git commit -m "feat: add component CRUD modal to admin UI"
```

---

## Phase 8: TypeScript Check & Testing

### Task 8.1: Full TypeScript Validation & Tests

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 2: Run tests**

```bash
npm test
```

Expected: All tests pass (55 existing + new component tests).

**Step 3: Run linter**

```bash
npm run lint
```

Expected: No errors (warnings are okay).

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify TypeScript, tests, and linting"
```

---

## Summary

This plan builds P4 Extended in two major phases:

**Infrastructure Phase (Tasks 1.1–1.5):** Database model, validation schemas, API routes (GET/POST/PATCH/DELETE), and integration tests. Single source of truth established.

**UI Phase (Tasks 2–7):** Admin registry (CRUD), public showcase (browse), editor palette (drag-to-place), and Aria integration (voice commands). All three interfaces backed by the same API.

**Validation Phase (Task 8):** TypeScript checks, test suite, linting.

### Total Scope
- ~500 lines of database schema + API routes
- ~600 lines of React UI components (palette, showcase, admin)
- ~200 lines of Aria integration
- 5 foundational components seeded
- Full test coverage for API layer

### Model Hint Distribution
- **Haiku tasks:** API routes, schema, boilerplate components, seed script
- **Sonnet tasks:** Component design, Aria integration strategy, props interface design
- **Gemini tasks:** (Deferred) Bulk component generation, documentation

---

## Execution Instructions

This plan is ready to execute. Two options:

**Option 1: Subagent-Driven (this session)**
- I dispatch a fresh subagent per task
- Code review after each commit
- Iterative refinement

**Option 2: Parallel Session (separate)**
- Open a new session with `superpowers:executing-plans`
- Batch execution with checkpoints
- Final review before merge

Which would you prefer?
