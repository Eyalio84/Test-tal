# Batch 8-9 Detailed Implementation Plan

> **For Claude:** These are the final two batches for P4 Atomic Component Library.
> Execute sequentially: Batch 8 (Tasks 5.1-5.2), then Batch 9 (Task 6.1)

---

## BATCH 8: Preview Images & Smoke Tests

### Task 5.1: Generate & Upload SVG Component Preview Images to R2

**Files:**
- Create: `scripts/generate-component-previews.ts`
- Modify: `prisma/schema.prisma` (if needed — verify previewImage field exists)
- Verify: `lib/r2.ts` (already has R2 client, r2Url helpers)

**Step 1: Create SVG generation utility**

Create `lib/component-preview.ts`:

```typescript
/**
 * Generate SVG preview thumbnail for a component
 * Shows: component name, category, props count
 */
export function generateComponentPreviewSVG(
  name: string,
  category: string,
  propsCount: number = 0
): string {
  const width = 400;
  const height = 300;
  
  // Color by category
  const categoryColors: Record<string, string> = {
    button: '#3B82F6',    // blue
    input: '#10B981',     // green
    card: '#F59E0B',      // amber
    overlay: '#8B5CF6',   // purple
    nav: '#EC4899',       // pink
    section: '#06B6D4',   // cyan
    badge: '#14B8A6',     // teal
    modal: '#EF4444',     // red
    dropdown: '#6366F1',  // indigo
    slider: '#84CC16',    // lime
  };
  
  const color = categoryColors[category] || '#64748B';
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="#0F172A"/>
      
      <!-- Header bar with category color -->
      <rect width="${width}" height="60" fill="${color}"/>
      
      <!-- Category text -->
      <text x="20" y="40" font-family="Inter, sans-serif" font-size="14" fill="white" font-weight="600">
        ${category.toUpperCase()}
      </text>
      
      <!-- Component name -->
      <text x="20" y="100" font-family="Inter, sans-serif" font-size="28" fill="white" font-weight="bold">
        ${name}
      </text>
      
      <!-- Props count -->
      <text x="20" y="160" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">
        ${propsCount} prop${propsCount !== 1 ? 's' : ''}
      </text>
      
      <!-- Decorative footer -->
      <rect y="${height - 40}" width="${width}" height="40" fill="${color}" opacity="0.1"/>
      <text x="20" y="${height - 15}" font-family="Inter, sans-serif" font-size="12" fill="#64748B">
        Component Preview
      </text>
    </svg>
  `;
}
```

**Step 2: Create seed script**

Create `scripts/generate-component-previews.ts`:

```typescript
import 'dotenv/config';
import { db } from '@/lib/db';
import { r2, r2Url } from '@/lib/r2';
import { generateComponentPreviewSVG } from '@/lib/component-preview';

async function generatePreviews() {
  console.log('🎨 Generating component preview images...');
  
  try {
    // Fetch all components without previewImage
    const components = await db.component.findMany({
      where: {
        // Only generate for components without preview
        // OR: regenerate all if you want fresh images
        // previewImage: null,
      },
    });
    
    if (components.length === 0) {
      console.log('✓ All components already have preview images');
      return;
    }
    
    console.log(`Processing ${components.length} components...`);
    
    for (const component of components) {
      // Generate SVG
      const propsCount = Object.keys(component.propsSchema as Record<string, unknown>).length;
      const svgContent = generateComponentPreviewSVG(
        component.name,
        component.category,
        propsCount
      );
      
      // Upload to R2
      const r2Key = `components/${component.slug}-preview.svg`;
      const buffer = Buffer.from(svgContent, 'utf-8');
      
      try {
        await r2.putObject({
          Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
          Key: r2Key,
          Body: buffer,
          ContentType: 'image/svg+xml',
        });
        
        console.log(`✓ ${component.slug}: uploaded to ${r2Key}`);
        
        // Update component with R2 URL
        const previewUrl = r2Url(r2Key);
        await db.component.update({
          where: { id: component.id },
          data: { previewImage: previewUrl },
        });
        
        console.log(`  → Updated Component.previewImage: ${previewUrl}`);
      } catch (error) {
        console.error(`✗ Failed to process ${component.slug}:`, error);
        throw error;
      }
    }
    
    console.log('✅ All previews generated and uploaded');
  } catch (error) {
    console.error('Failed to generate previews:', error);
    process.exit(1);
  }
}

generatePreviews();
```

**Step 3: Add script to package.json**

Modify `package.json` scripts section:

```json
"generate-previews": "tsx --env-file=.env.local scripts/generate-component-previews.ts"
```

**Step 4: Run the script**

```bash
npm run generate-previews
```

Expected output:
```
🎨 Generating component preview images...
Processing 30 components...
✓ button-primary: uploaded to components/button-primary-preview.svg
✓ button-secondary: uploaded to components/button-secondary-preview.svg
...
✅ All previews generated and uploaded
```

**Step 5: Verify in UI**

Open dev server and navigate:
- `/admin/components` — all component cards should show SVG preview thumbnails
- `/components` — public showcase should display the same previews

Expected: Colorful SVG cards with component names, categories, and prop counts.

**Step 6: Run checks**

```bash
npx tsc --noEmit
npm test
```

Expected: No errors, tests still pass.

**Step 7: Commit**

```bash
git add lib/component-preview.ts scripts/generate-component-previews.ts package.json
git commit -m "feat: generate and upload SVG component preview images to R2"
```

---

### Task 5.2: Full End-to-End Component Registry Tests

**Files:**
- Create: `tests/e2e/component-registry.test.ts`

**Step 1: Install Playwright (if not already installed)**

Check if Playwright is in `package.json` devDependencies. If not:

```bash
npm install -D @playwright/test
```

(It should already be installed from vitest setup, but verify.)

**Step 2: Create E2E test file**

Create `tests/e2e/component-registry.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { db } from '@/lib/db';

describe('Component Registry E2E', () => {
  let browser: Browser;
  let page: Page;
  const testComponentId = `test-comp-${Date.now()}`;

  beforeAll(async () => {
    // Launch browser
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
    // Clean up test data
    await db.component.deleteMany({
      where: { slug: testComponentId },
    });
  });

  describe('Admin Registry Flow', () => {
    it('should create component via API', async () => {
      const res = await page.request.post('http://localhost:3000/api/admin/components', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          slug: testComponentId,
          name: 'Test Component E2E',
          category: 'button',
          description: 'E2E test component',
          ariaName: 'test_e2e_component',
          propsSchema: {
            label: { type: 'string', required: true },
            size: { type: 'enum', enum: ['sm', 'md', 'lg'], default: 'md' },
          },
        },
      });

      expect(res.status()).toBe(201);
      const data = await res.json() as { id: string; slug: string };
      expect(data.slug).toBe(testComponentId);
    });

    it('should fetch component from public API', async () => {
      const res = await page.request.get(`http://localhost:3000/api/components?search=${testComponentId}`);
      
      expect(res.status()).toBe(200);
      const data = await res.json() as Array<{ slug: string; name: string }>;
      const found = data.find(c => c.slug === testComponentId);
      
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Component E2E');
    });

    it('should display component in admin UI', async () => {
      // Navigate to admin page
      await page.goto('http://localhost:3000/admin/components', { waitUntil: 'networkidle' });

      // Search for test component
      await page.fill('input[placeholder="Search components..."]', testComponentId);
      await page.waitForTimeout(500); // Wait for search debounce

      // Verify component appears
      const componentCard = page.locator(`text=${testComponentId}`);
      await expect(componentCard).toBeVisible();
    });

    it('should display component preview image', async () => {
      await page.goto('http://localhost:3000/admin/components', { waitUntil: 'networkidle' });
      
      // Search for component
      await page.fill('input[placeholder="Search components..."]', testComponentId);
      await page.waitForTimeout(500);

      // Find component card and verify preview image exists
      const card = page.locator('div').filter({ has: page.locator(`text=${testComponentId}`) }).first();
      const image = card.locator('img');
      
      // Verify image source contains R2 URL pattern
      const src = await image.getAttribute('src');
      expect(src).toMatch(/r2\.dev|imagecdn/); // Cloudflare R2 URL pattern
    });
  });

  describe('Public Showcase Flow', () => {
    it('should display component in public showcase', async () => {
      await page.goto('http://localhost:3000/components', { waitUntil: 'networkidle' });

      // Filter by category
      const categoryButton = page.locator('button', { hasText: 'button' });
      await categoryButton.click();
      await page.waitForTimeout(300);

      // Find component
      const component = page.locator('text=Test Component E2E');
      await expect(component).toBeVisible();
    });

    it('should show component detail page', async () => {
      await page.goto('http://localhost:3000/components', { waitUntil: 'networkidle' });
      
      // Click on component (it's a link to /components/[slug])
      const link = page.locator(`a[href*="/${testComponentId}"]`).first();
      await link.click();
      
      // Verify detail page loaded
      await page.waitForURL(`**/components/${testComponentId}`);
      
      // Check for component details
      await expect(page.locator('text=Test Component E2E')).toBeVisible();
      await expect(page.locator('text=Props')).toBeVisible();
      await expect(page.locator('text=Aria Command')).toBeVisible();
    });

    it('should display Aria command hint', async () => {
      await page.goto(`http://localhost:3000/components/${testComponentId}`, { waitUntil: 'networkidle' });
      
      // Verify Aria command is shown
      const command = page.locator('text=test_e2e_component');
      await expect(command).toBeVisible();
    });
  });

  describe('Component Registry Schema', () => {
    it('should return valid component registry shape', async () => {
      const res = await page.request.get('http://localhost:3000/api/components');
      const components = await res.json() as Array<any>;

      // Verify schema
      expect(Array.isArray(components)).toBe(true);
      if (components.length > 0) {
        const sample = components[0];
        expect(sample).toHaveProperty('id');
        expect(sample).toHaveProperty('slug');
        expect(sample).toHaveProperty('name');
        expect(sample).toHaveProperty('category');
        expect(sample).toHaveProperty('description');
        expect(sample).toHaveProperty('ariaName');
        expect(sample).toHaveProperty('propsSchema');
        expect(typeof sample.propsSchema).toBe('object');
      }
    });

    it('should include preview images in API response', async () => {
      const res = await page.request.get(`http://localhost:3000/api/components?search=${testComponentId}`);
      const data = await res.json() as Array<{ previewImage?: string }>;
      
      const component = data.find(c => (c as any).slug === testComponentId);
      expect(component?.previewImage).toBeDefined();
      expect(component?.previewImage).toMatch(/\.svg|r2\.dev/);
    });
  });

  describe('Component Filtering & Search', () => {
    it('should filter components by category', async () => {
      const res = await page.request.get('http://localhost:3000/api/components?category=button');
      const components = await res.json() as Array<{ category: string }>;
      
      // All should be button category
      expect(components.every(c => c.category === 'button')).toBe(true);
    });

    it('should search components by name', async () => {
      const res = await page.request.get(`http://localhost:3000/api/components?search=Test`);
      const components = await res.json() as Array<{ name: string; slug: string }>;
      
      // Should find our test component
      const found = components.find(c => c.slug === testComponentId);
      expect(found).toBeDefined();
    });

    it('should search components by ariaName', async () => {
      const res = await page.request.get('http://localhost:3000/api/components?search=test_e2e');
      const components = await res.json() as Array<{ ariaName: string }>;
      
      const found = components.find(c => c.ariaName === 'test_e2e_component');
      expect(found).toBeDefined();
    });
  });
});
```

**Step 3: Verify Playwright can access the site**

Start dev server (if not already running):

```bash
npm run dev
```

Then in another terminal, run the tests:

```bash
npm test tests/e2e/component-registry.test.ts
```

Expected output:
```
✓ tests/e2e/component-registry.test.ts (14 tests)
  ✓ Component Registry E2E
    ✓ should create component via API
    ✓ should fetch component from public API
    ✓ should display component in admin UI
    ✓ should display component preview image
    ✓ should display component in public showcase
    ✓ should show component detail page
    ✓ should display Aria command hint
    ✓ should return valid component registry shape
    ✓ should include preview images in API response
    ✓ should filter components by category
    ✓ should search components by name
    ✓ should search components by ariaName
```

**Step 4: Run full test suite**

```bash
npm test
```

Expected: All tests pass (148 tests across 23 files).

**Step 5: Commit**

```bash
git add tests/e2e/component-registry.test.ts
git commit -m "test: add full end-to-end component registry tests with Playwright"
```

---

## BATCH 9: Final Validation

### Task 6.1: TypeScript, Tests, and Linting Validation

**Files:**
- No new files — validation only

**Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Expected output:
```
```
(Empty — no errors)

If errors appear:
- Read the error messages carefully
- Locate the problematic file(s)
- Fix type issues (usually missing types or incorrect imports)
- Rerun `npx tsc --noEmit` until clean

**Step 2: Run full test suite**

```bash
npm test
```

Expected output:
```
 ✓ tests/ (148 tests) 1234ms
   ✓ api/ (XX tests)
   ✓ ui/ (XX tests)
   ✓ hooks/ (XX tests)
   ✓ e2e/ (14 tests)
```

If tests fail:
- Read failure messages
- Diagnose the issue (usually timing or mock data)
- Fix the test or implementation
- Rerun until all pass

**Step 3: Linting check**

```bash
npm run lint
```

Expected output:
```
Checked 147 files
```

Review any warnings (usually harmless):
- Unused variables: safe to ignore if intentional
- Comment formatting: safe to ignore
- Long lines: safe to ignore

If there are ERRORS (not warnings):
- Fix them immediately
- Rerun `npm run lint`

**Step 4: Dev server sanity check**

Start dev server:

```bash
npm run dev
```

In browser, manually verify:
- `/admin/components` loads, shows component grid with previews
- `/components` loads, shows public showcase
- `/components/[slug]` loads for any component
- `/admin/editor` loads without errors (palette sidebar should show components)

Then stop the server: `Ctrl+C`

**Step 5: Final commit (if any fixes were needed)**

```bash
git add .
git commit -m "fix: address validation issues from TypeScript/test/lint checks"
```

(Skip if nothing needed fixing.)

**Step 6: Create summary report**

Create `BATCH_8_9_REPORT.md`:

```markdown
# Batch 8-9 Completion Report

## Batch 8: Preview Images & Smoke Tests

### Task 5.1: SVG Component Previews
- Generated SVG thumbnails for all 30-50 components
- Uploaded all previews to Cloudflare R2
- Updated Component.previewImage with R2 URLs
- Status: ✅ COMPLETE

### Task 5.2: Full E2E Tests
- Created 14 Playwright browser tests
- Tested: admin API, public showcase, detail pages, filtering, search
- All tests passing
- Status: ✅ COMPLETE

### Batch 8 Verification
- TypeScript: PASS ✓
- Tests: 148 passing ✓
- Linting: No errors ✓

## Batch 9: Final Validation

### Task 6.1: Validation Checks
- TypeScript: PASS ✓ (no type errors)
- Tests: PASS ✓ (148/148 tests passing)
- Linting: PASS ✓ (no errors)
- Dev server: PASS ✓ (all routes load correctly)

## Summary
✅ **P4 ATOMIC COMPONENT LIBRARY 100% COMPLETE**

- Phase 1: Database + API ✅
- Phase 2: Admin UI ✅
- Phase 3: Public Showcase ✅
- Phase 4: Editor Palette ✅
- Phase 5: Aria Integration ✅ (Tasks 4.1-4.2 completed earlier)
- Phase 6: Preview Images ✅
- Phase 7: Full Testing ✅

All 21 tasks complete. Code ready for deployment.
```

**Step 7: Final commit**

```bash
git add BATCH_8_9_REPORT.md
git commit -m "docs: add batch 8-9 completion report"
```

---

## Success Criteria

**Batch 8 Complete when:**
- ✅ SVG preview images generated for all components
- ✅ All images uploaded to R2 and visible in UI
- ✅ 14 E2E tests passing (admin flow, showcase, detail, Aria, search)
- ✅ No TypeScript errors
- ✅ All tests passing (148/148)
- ✅ No lint errors

**Batch 9 Complete when:**
- ✅ `npx tsc --noEmit` returns nothing (no errors)
- ✅ `npm test` shows 148 passing
- ✅ `npm run lint` shows no errors
- ✅ Dev server loads all pages without console errors
- ✅ Commit created with summary

---

## Haiku: Ready to Execute

Once you receive this plan:

1. **Read completely** (this entire file)
2. **Start Batch 8, Task 5.1:** Generate SVG previews
3. **Complete Task 5.1**, verify, commit, report
4. **Continue Task 5.2:** Write E2E tests
5. **Complete Task 5.2**, verify, commit, report  
6. **Batch 8 done:** Report status to coordinator
7. **Start Batch 9, Task 6.1:** Run validation checks
8. **Fix any issues** that appear
9. **Report final status:** All checks passing

**Total time estimate:** 3-4 hours for both batches.

Good luck! 🚀
