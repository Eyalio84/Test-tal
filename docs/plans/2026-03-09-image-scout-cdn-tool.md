# Image Scout CDN Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone React app for curating images via Gemini search, with metadata editing, selective R2 upload, and rejection feedback collection.

**Architecture:** 
Pure frontend application (no backend server). User enters a prompt → app calls Gemini to search for images → displays 10 results in a grid → user selects/rejects with feedback reasons → uploads selected to R2 → generates downloadable report with metadata + rejection reasons. Can be deployed as standalone HTML/React or integrated into StoreKit as `/admin/image-scout` route later.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Gemini API (google-generative-ai SDK), Cloudflare R2 (AWS SDK S3Client), TanStack Query for async state.

---

## Prerequisites & Setup

### Env Variables Needed (Client-Side)
```
VITE_GEMINI_API_KEY=AIzaSyD13DdkJGzn1Vra_xDx9ZOZuRMNsZq-4Oo
VITE_CLOUDFLARE_ACCOUNT_ID=6c84020cbee8bfd414925a41d1d4f91d
VITE_CLOUDFLARE_R2_ACCESS_KEY_ID=2d262391546fda42e8266d286ea639aa
VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY=16d787b105d50b6ad356ad5cd502e42f3cf9b42c4ff1697d17c7fead96493dc9
VITE_CLOUDFLARE_R2_BUCKET_NAME=imagecdn
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://pub-b21fbecca9af425caad98596c465dad6.r2.dev
```

**Note:** These are exposed in client-side code (frontend app). In production, consider using temporary STS credentials or a lightweight API gateway, but for MVP this is acceptable for personal tool.

---

## Task Structure

### Task 1: Project Setup (Standalone React App)

**Files:**
- Create: `apps/image-scout/package.json`
- Create: `apps/image-scout/index.html`
- Create: `apps/image-scout/vite.config.ts`
- Create: `apps/image-scout/.env.example`
- Create: `apps/image-scout/src/main.tsx`
- Create: `apps/image-scout/src/App.tsx`

**Step 1: Create directory structure**

```bash
mkdir -p apps/image-scout/src apps/image-scout/public
cd apps/image-scout
```

**Step 2: Initialize package.json**

```json
{
  "name": "image-scout",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "@google/generative-ai": "^0.21.0",
    "@aws-sdk/client-s3": "^3.1004.0",
    "@tanstack/react-query": "^5.90.21",
    "@tanstack/react-query-devtools": "^5.91.3",
    "clsx": "^2.1.1",
    "tailwindcss": "^4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "typescript": "^5",
    "@types/react": "^19",
    "@types/react-dom": "^19"
  }
}
```

**Step 3: Create Vite config**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
```

**Step 4: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Image Scout — CDN Curator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Create main.tsx & App.tsx (empty scaffolds)**

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

```typescript
// src/App.tsx
export default function App() {
  return <div className="min-h-screen bg-slate-950">Image Scout</div>
}
```

**Step 6: Install dependencies**

```bash
npm install
```

**Step 7: Run dev server**

```bash
npm run dev
```

Expected: Vite server running on http://localhost:5173

**Step 8: Commit**

```bash
git add apps/image-scout/
git commit -m "feat: scaffold image-scout standalone app with Vite + React"
```

---

### Task 2: Setup Gemini & R2 API Clients

**Files:**
- Create: `apps/image-scout/src/lib/gemini.ts`
- Create: `apps/image-scout/src/lib/r2.ts`
- Create: `apps/image-scout/src/lib/env.ts`

**Step 1: Create env validation**

```typescript
// src/lib/env.ts
export const env = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  CLOUDFLARE_ACCOUNT_ID: import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || '',
  CLOUDFLARE_R2_ACCESS_KEY_ID: import.meta.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID || '',
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: import.meta.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  CLOUDFLARE_R2_BUCKET_NAME: import.meta.env.VITE_CLOUDFLARE_R2_BUCKET_NAME || 'imagecdn',
  CLOUDFLARE_R2_PUBLIC_URL: import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_URL || '',
};

if (!env.GEMINI_API_KEY) {
  throw new Error('Missing VITE_GEMINI_API_KEY');
}
if (!env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
  throw new Error('Missing VITE_CLOUDFLARE_R2_ACCESS_KEY_ID');
}
```

**Step 2: Create Gemini client**

```typescript
// src/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export interface ImageSearchResult {
  url: string;
  title: string;
  alt: string;
  source: string;
}

export async function searchImages(prompt: string, count: number = 10): Promise<ImageSearchResult[]> {
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const response = await model.generateContent(
      `Search for images matching this description: "${prompt}"
       
       Return a JSON array with ${count} image results. Each result should have:
       - url: a direct image URL (real, working URLs)
       - title: short image title
       - alt: descriptive alt text
       - source: where the image came from
       
       Return ONLY valid JSON array, no other text.
       
       Example format:
       [
         {"url": "https://...", "title": "...", "alt": "...", "source": "..."},
         ...
       ]`
    );

    const content = response.response.text();
    const parsed = JSON.parse(content);
    
    return Array.isArray(parsed) ? parsed.slice(0, count) : [];
  } catch (error) {
    console.error('Failed to search images:', error);
    throw new Error('Image search failed');
  }
}

export async function generateMetadata(
  imageUrl: string,
  prompt: string
): Promise<{ title: string; alt: string; tags: string[] }> {
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const response = await model.generateContent(
      `Given this image: ${imageUrl}
       And this context: "${prompt}"
       
       Generate JSON metadata:
       {
         "title": "Short 5-word title",
         "alt": "Descriptive alt text (20 words)",
         "tags": ["tag1", "tag2", "tag3"]
       }
       
       Return ONLY the JSON, no other text.`
    );

    const content = response.response.text();
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return { title: 'Image', alt: 'Image', tags: [] };
  }
}
```

**Step 3: Create R2 upload client**

```typescript
// src/lib/r2.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env';

const s3Client = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.googleapis.com`,
});

export async function uploadImageToR2(
  file: File,
  slug: string
): Promise<string> {
  try {
    const key = `image-scout/${slug}/${Date.now()}.${file.name.split('.').pop()}`;
    
    const buffer = await file.arrayBuffer();
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    return `${env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('Failed to upload to R2:', error);
    throw new Error('R2 upload failed');
  }
}

export function r2Url(key: string): string {
  return `${env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}
```

**Step 4: Test manually**

```bash
npm run dev
# Open browser console and test:
# import { searchImages } from './lib/gemini'
# searchImages('vintage leather bags')
```

**Step 5: Commit**

```bash
git add apps/image-scout/src/lib/
git commit -m "feat: add Gemini + R2 API clients"
```

---

### Task 3: Create Main App Layout (Search + Grid)

**Files:**
- Create: `apps/image-scout/src/App.tsx` (rewrite)
- Create: `apps/image-scout/src/index.css`
- Create: `apps/image-scout/src/types/index.ts`

**Step 1: Define types**

```typescript
// src/types/index.ts
export interface SearchImage {
  id: string;
  url: string;
  title: string;
  alt: string;
  source: string;
  selected: boolean;
  rejectionReason?: string;
  metadata: {
    title: string;
    alt: string;
    tags: string[];
  };
}

export interface ScoutSession {
  prompt: string;
  referenceImage?: string;
  images: SearchImage[];
  status: 'idle' | 'searching' | 'ready' | 'uploading';
}
```

**Step 2: Create Tailwind CSS**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  color-scheme: dark;
}

body {
  background: #0f172a;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

input, textarea {
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
}

button {
  transition: all 0.2s;
}
```

**Step 3: Create App layout**

```typescript
// src/App.tsx
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchPanel from './components/SearchPanel';
import ImageGrid from './components/ImageGrid';
import ReviewPanel from './components/ReviewPanel';
import { ScoutSession, SearchImage } from './types';

const queryClient = new QueryClient();

export default function App() {
  const [session, setSession] = useState<ScoutSession>({
    prompt: '',
    images: [],
    status: 'idle',
  });

  const handleSearch = async (prompt: string, referenceImage?: string) => {
    setSession(prev => ({
      ...prev,
      prompt,
      referenceImage,
      status: 'searching',
      images: [], // Reset
    }));

    try {
      // TODO: Call searchImages API
      // const results = await searchImages(prompt, 10);
      // Generate metadata for each, store in session
      setSession(prev => ({
        ...prev,
        status: 'ready',
      }));
    } catch (error) {
      setSession(prev => ({
        ...prev,
        status: 'idle',
      }));
      alert('Search failed. Check console.');
    }
  };

  const handleSelectImage = (id: string, selected: boolean) => {
    setSession(prev => ({
      ...prev,
      images: prev.images.map(img =>
        img.id === id ? { ...img, selected } : img
      ),
    }));
  };

  const handleRejectImage = (id: string, reason: string) => {
    setSession(prev => ({
      ...prev,
      images: prev.images.map(img =>
        img.id === id ? { ...img, selected: false, rejectionReason: reason } : img
      ),
    }));
  };

  const handleUpdateMetadata = (id: string, metadata: Partial<SearchImage['metadata']>) => {
    setSession(prev => ({
      ...prev,
      images: prev.images.map(img =>
        img.id === id ? { ...img, metadata: { ...img.metadata, ...metadata } } : img
      ),
    }));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Image Scout</h1>
            <p className="text-slate-400">
              Search, curate, and batch upload images to your CDN
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Search Panel (Left) */}
            <div className="lg:col-span-1">
              <SearchPanel
                isLoading={session.status === 'searching'}
                onSearch={handleSearch}
              />
            </div>

            {/* Image Grid (Center) */}
            <div className="lg:col-span-2">
              {session.status === 'searching' && (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-slate-400">Searching for images...</p>
                </div>
              )}

              {session.images.length > 0 && (
                <ImageGrid
                  images={session.images}
                  onSelectImage={handleSelectImage}
                  onRejectImage={handleRejectImage}
                  onUpdateMetadata={handleUpdateMetadata}
                />
              )}

              {session.status === 'idle' && session.images.length === 0 && (
                <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-700">
                  <p className="text-slate-400">Enter a search query to get started</p>
                </div>
              )}
            </div>

            {/* Review Panel (Right) */}
            {session.images.length > 0 && (
              <div className="lg:col-span-1">
                <ReviewPanel
                  images={session.images}
                  isUploading={session.status === 'uploading'}
                  onSubmit={async () => {
                    // TODO: Upload selected images
                    setSession(prev => ({
                      ...prev,
                      status: 'uploading',
                    }));
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}
```

**Step 4: Commit**

```bash
git add apps/image-scout/src/
git commit -m "feat: create app layout with search, grid, review panels"
```

---

### Task 4: Build SearchPanel Component

**Files:**
- Create: `apps/image-scout/src/components/SearchPanel.tsx`

**Step 1: Create component**

```typescript
// src/components/SearchPanel.tsx
import { useState } from 'react';

interface SearchPanelProps {
  isLoading: boolean;
  onSearch: (prompt: string, referenceImage?: string) => void;
}

export default function SearchPanel({ isLoading, onSearch }: SearchPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
    }
  };

  const handleSearch = () => {
    if (!prompt.trim()) {
      alert('Please enter a search prompt');
      return;
    }
    onSearch(prompt, referenceImage ? URL.createObjectURL(referenceImage) : undefined);
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-white mb-4">Search</h2>

      {/* Prompt */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Search Prompt
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g., vintage leather bags, studio photography, warm lighting"
          className="w-full px-3 py-2 rounded border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          rows={5}
          disabled={isLoading}
        />
        <p className="text-xs text-slate-500 mt-2">
          Be specific about style, lighting, angle, and mood
        </p>
      </div>

      {/* Reference Image */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Reference Image (Optional)
        </label>
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-slate-500 transition">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="reference-image"
            disabled={isLoading}
          />
          <label htmlFor="reference-image" className="block cursor-pointer">
            {referenceImage ? (
              <p className="text-sm text-blue-400">{referenceImage.name}</p>
            ) : (
              <>
                <p className="text-slate-400 text-sm mb-1">Click to upload</p>
                <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleSearch}
        disabled={isLoading || !prompt.trim()}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
      >
        {isLoading ? 'Searching...' : 'Generate Images'}
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/image-scout/src/components/SearchPanel.tsx
git commit -m "feat: add SearchPanel component with prompt and reference image"
```

---

### Task 5: Build ImageGrid & MetadataEditor Components

**Files:**
- Create: `apps/image-scout/src/components/ImageGrid.tsx`
- Create: `apps/image-scout/src/components/ImageCard.tsx`
- Create: `apps/image-scout/src/components/MetadataEditor.tsx`

**Step 1: Create ImageCard**

```typescript
// src/components/ImageCard.tsx
import { useState } from 'react';
import { SearchImage } from '../types';
import MetadataEditor from './MetadataEditor';

interface ImageCardProps {
  image: SearchImage;
  onSelect: (selected: boolean) => void;
  onReject: (reason: string) => void;
  onUpdateMetadata: (metadata: Partial<SearchImage['metadata']>) => void;
}

export default function ImageCard({
  image,
  onSelect,
  onReject,
  onUpdateMetadata,
}: ImageCardProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div
      className={`border-2 rounded-lg overflow-hidden transition ${
        image.selected
          ? 'border-green-500 bg-green-500/5'
          : image.rejectionReason
            ? 'border-red-500 bg-red-500/5'
            : 'border-slate-700 bg-slate-800/50'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-900 overflow-hidden">
        <img
          src={image.url}
          alt={image.alt}
          className="w-full h-full object-cover"
          onError={e => (e.currentTarget.src = '/placeholder.svg')}
        />

        {/* Selection Checkbox */}
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={image.selected}
            onChange={e => onSelect(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-white cursor-pointer"
          />
        </div>

        {/* Status Badge */}
        {image.selected && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Selected
          </div>
        )}
        {image.rejectionReason && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Rejected
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-3">
        <h3 className="font-medium text-white text-sm truncate mb-1">
          {image.metadata.title}
        </h3>
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
          {image.metadata.alt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {image.metadata.tags.map(tag => (
            <span
              key={tag}
              className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Rejection Reason */}
        {image.rejectionReason && (
          <p className="text-xs text-red-300 bg-red-900/30 p-2 rounded mb-2">
            {image.rejectionReason}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="flex-1 text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
          >
            {showMetadata ? 'Hide' : 'Edit'}
          </button>
          <button
            onClick={() => onReject('Not relevant')}
            className="flex-1 text-xs px-2 py-1 bg-red-900 hover:bg-red-800 text-white rounded transition"
          >
            Reject
          </button>
        </div>

        {/* Metadata Editor */}
        {showMetadata && (
          <MetadataEditor
            metadata={image.metadata}
            onUpdate={onUpdateMetadata}
          />
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create MetadataEditor**

```typescript
// src/components/MetadataEditor.tsx
import { useState } from 'react';
import { SearchImage } from '../types';

interface MetadataEditorProps {
  metadata: SearchImage['metadata'];
  onUpdate: (metadata: Partial<SearchImage['metadata']>) => void;
}

export default function MetadataEditor({
  metadata,
  onUpdate,
}: MetadataEditorProps) {
  const [title, setTitle] = useState(metadata.title);
  const [alt, setAlt] = useState(metadata.alt);
  const [tags, setTags] = useState(metadata.tags.join(', '));

  const handleSave = () => {
    onUpdate({
      title,
      alt,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="mt-3 p-3 bg-slate-700/30 rounded border border-slate-600 space-y-2">
      <div>
        <label className="text-xs text-slate-400">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-2 py-1 text-xs rounded bg-slate-800 border border-slate-600 text-white"
        />
      </div>

      <div>
        <label className="text-xs text-slate-400">Alt Text</label>
        <textarea
          value={alt}
          onChange={e => setAlt(e.target.value)}
          className="w-full px-2 py-1 text-xs rounded bg-slate-800 border border-slate-600 text-white"
          rows={2}
        />
      </div>

      <div>
        <label className="text-xs text-slate-400">Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="w-full px-2 py-1 text-xs rounded bg-slate-800 border border-slate-600 text-white"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
      >
        Save
      </button>
    </div>
  );
}
```

**Step 3: Create ImageGrid**

```typescript
// src/components/ImageGrid.tsx
import { SearchImage } from '../types';
import ImageCard from './ImageCard';

interface ImageGridProps {
  images: SearchImage[];
  onSelectImage: (id: string, selected: boolean) => void;
  onRejectImage: (id: string, reason: string) => void;
  onUpdateMetadata: (id: string, metadata: Partial<SearchImage['metadata']>) => void;
}

export default function ImageGrid({
  images,
  onSelectImage,
  onRejectImage,
  onUpdateMetadata,
}: ImageGridProps) {
  if (images.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        Images ({images.length})
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            onSelect={selected => onSelectImage(image.id, selected)}
            onReject={reason => onRejectImage(image.id, reason)}
            onUpdateMetadata={metadata => onUpdateMetadata(image.id, metadata)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add apps/image-scout/src/components/
git commit -m "feat: add ImageCard, MetadataEditor, ImageGrid components"
```

---

### Task 6: Build ReviewPanel & Report Generation

**Files:**
- Create: `apps/image-scout/src/components/ReviewPanel.tsx`
- Create: `apps/image-scout/src/lib/report.ts`

**Step 1: Create report generator**

```typescript
// src/lib/report.ts
import { SearchImage, ScoutSession } from '../types';

export interface ScoutReport {
  timestamp: string;
  prompt: string;
  totalImages: number;
  selected: SearchImage[];
  rejected: Array<SearchImage & { rejectionReason: string }>;
  cdnUrls: Record<string, string>; // image.id -> r2Url
}

export function generateReport(session: ScoutSession, cdnUrls: Record<string, string>): ScoutReport {
  const selected = session.images.filter(img => img.selected);
  const rejected = session.images.filter(img => img.rejectionReason) as Array<SearchImage & { rejectionReason: string }>;

  return {
    timestamp: new Date().toISOString(),
    prompt: session.prompt,
    totalImages: session.images.length,
    selected,
    rejected,
    cdnUrls,
  };
}

export function reportToMarkdown(report: ScoutReport): string {
  return `# Image Scout Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}

## Search Prompt
\`\`\`
${report.prompt}
\`\`\`

## Summary
- **Total images searched:** ${report.totalImages}
- **Selected:** ${report.selected.length}
- **Rejected:** ${report.rejected.length}

## Selected Images (Uploaded to CDN)

${report.selected.map(img => `
### ${img.metadata.title}
- **CDN URL:** ${report.cdnUrls[img.id] || 'N/A'}
- **Alt Text:** ${img.metadata.alt}
- **Tags:** ${img.metadata.tags.join(', ')}
- **Source:** ${img.source}
`).join('\n')}

## Rejected Images (Feedback for Prompt Refinement)

${report.rejected.map(img => `
### ${img.metadata.title}
- **Reason:** ${img.rejectionReason}
- **Alt Text:** ${img.metadata.alt}
- **Source:** ${img.source}

**Why this was rejected:** This tells us you're looking for images that are NOT like this one. Consider these characteristics for the next search prompt.
`).join('\n')}

## Feedback Summary

Use the rejection reasons above to refine your image-scout prompt for future searches. Common rejection patterns:
- If multiple rejections mention "lighting", adjust the lighting description in your prompt
- If rejections mention "angle", be more specific about product angle (3/4 view, flat lay, etc.)
- If rejections mention "style", add more style keywords (minimalist, vintage, modern, etc.)

---

*Generated by Image Scout CDN Tool*
`;
}

export function downloadReport(report: ScoutReport, format: 'json' | 'markdown' = 'markdown') {
  const content = format === 'markdown' ? reportToMarkdown(report) : JSON.stringify(report, null, 2);
  const filename = `image-scout-report-${report.timestamp.split('T')[0]}.${format === 'markdown' ? 'md' : 'json'}`;

  const blob = new Blob([content], {
    type: format === 'markdown' ? 'text/markdown' : 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

**Step 2: Create ReviewPanel**

```typescript
// src/components/ReviewPanel.tsx
import { SearchImage } from '../types';
import { generateReport, downloadReport } from '../lib/report';

interface ReviewPanelProps {
  images: SearchImage[];
  isUploading: boolean;
  onSubmit: () => void;
}

export default function ReviewPanel({
  images,
  isUploading,
  onSubmit,
}: ReviewPanelProps) {
  const selected = images.filter(img => img.selected);
  const rejected = images.filter(img => img.rejectionReason);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-white mb-4">Review</h2>

      {/* Stats */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Total</span>
          <span className="text-white font-medium">{images.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-green-400">Selected</span>
          <span className="text-green-400 font-medium">{selected.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-red-400">Rejected</span>
          <span className="text-red-400 font-medium">{rejected.length}</span>
        </div>
      </div>

      {/* Selected List */}
      {selected.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-green-400 mb-2">Selected</h3>
          <ul className="space-y-1 text-xs">
            {selected.map(img => (
              <li key={img.id} className="text-slate-300 truncate">
                ✓ {img.metadata.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rejected List */}
      {rejected.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-red-400 mb-2">Rejected</h3>
          <ul className="space-y-1 text-xs">
            {rejected.map(img => (
              <li key={img.id} className="text-slate-400">
                ✗ {img.metadata.title}
                <br />
                <span className="text-red-300 text-xs">
                  "{img.rejectionReason}"
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onSubmit}
          disabled={isUploading || selected.length === 0}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
        >
          {isUploading ? 'Uploading...' : `Upload ${selected.length} Images`}
        </button>

        <button
          onClick={() => {
            const report = generateReport(
              {
                prompt: '',
                images,
                status: 'ready',
              },
              {}
            );
            downloadReport(report, 'markdown');
          }}
          className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
        >
          Download Report
        </button>
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-slate-500 mt-4 text-center">
          Select at least one image to upload
        </p>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/image-scout/src/components/ReviewPanel.tsx apps/image-scout/src/lib/report.ts
git commit -m "feat: add ReviewPanel and report generation"
```

---

### Task 7: Integrate Gemini Image Search & R2 Upload

**Files:**
- Modify: `apps/image-scout/src/App.tsx`

**Step 1: Update App with Gemini integration**

Replace the `handleSearch` function in App.tsx:

```typescript
const handleSearch = async (prompt: string, referenceImage?: string) => {
  setSession(prev => ({
    ...prev,
    prompt,
    referenceImage,
    status: 'searching',
    images: [],
  }));

  try {
    const { searchImages, generateMetadata } = await import('./lib/gemini');
    
    // Search for images
    const results = await searchImages(prompt, 10);
    
    // Generate metadata for each image
    const imagesWithMetadata = await Promise.all(
      results.map(async (result, idx) => {
        const metadata = await generateMetadata(result.url, prompt).catch(() => ({
          title: result.title,
          alt: result.alt,
          tags: [],
        }));
        
        return {
          id: `img-${idx}`,
          ...result,
          selected: false,
          metadata,
        };
      })
    );

    setSession(prev => ({
      ...prev,
      images: imagesWithMetadata,
      status: 'ready',
    }));
  } catch (error) {
    console.error('Search failed:', error);
    setSession(prev => ({
      ...prev,
      status: 'idle',
    }));
    alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
```

**Step 2: Add upload handler**

Add to App.tsx:

```typescript
const handleSubmit = async () => {
  const selected = session.images.filter(img => img.selected);
  if (selected.length === 0) {
    alert('No images selected');
    return;
  }

  setSession(prev => ({
    ...prev,
    status: 'uploading',
  }));

  try {
    const { uploadImageToR2 } = await import('./lib/r2');
    const cdnUrls: Record<string, string> = {};

    // Download and upload each image
    for (const image of selected) {
      try {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const file = new File([blob], `${image.id}.jpg`, { type: 'image/jpeg' });
        
        const r2Url = await uploadImageToR2(file, image.metadata.title.toLowerCase().replace(/\s+/g, '-'));
        cdnUrls[image.id] = r2Url;
      } catch (error) {
        console.error(`Failed to upload ${image.id}:`, error);
      }
    }

    // Generate report
    const { generateReport, downloadReport } = await import('./lib/report');
    const report = generateReport(session, cdnUrls);
    downloadReport(report, 'markdown');

    alert(`✅ Uploaded ${Object.keys(cdnUrls).length} images. Report downloaded.`);
    
    setSession({
      prompt: '',
      images: [],
      status: 'idle',
    });
  } catch (error) {
    console.error('Upload failed:', error);
    alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    setSession(prev => ({
      ...prev,
      status: 'ready',
    }));
  }
};
```

**Step 3: Update ReviewPanel prop**

```typescript
<ReviewPanel
  images={session.images}
  isUploading={session.status === 'uploading'}
  onSubmit={handleSubmit}
/>
```

**Step 4: Commit**

```bash
git add apps/image-scout/src/App.tsx apps/image-scout/src/lib/
git commit -m "feat: integrate Gemini search and R2 upload"
```

---

### Task 8: Styling & Polish

**Files:**
- Modify: `apps/image-scout/src/index.css`
- Create: `apps/image-scout/public/placeholder.svg`

**Step 1: Add placeholder image**

```svg
<!-- public/placeholder.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect fill="#1e293b" width="400" height="400"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#64748b" font-size="20" font-family="sans-serif">
    Image not loaded
  </text>
</svg>
```

**Step 2: Enhance CSS**

```css
/* src/index.css - add these */
@layer components {
  .badge {
    @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium;
  }
  
  .badge-primary {
    @apply bg-blue-500/20 text-blue-300;
  }
  
  .badge-success {
    @apply bg-green-500/20 text-green-300;
  }
  
  .badge-danger {
    @apply bg-red-500/20 text-red-300;
  }

  .card {
    @apply bg-slate-900 border border-slate-700 rounded-lg;
  }

  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white;
  }

  .btn-secondary {
    @apply bg-slate-700 hover:bg-slate-600 text-white;
  }

  .btn-danger {
    @apply bg-red-900 hover:bg-red-800 text-white;
  }
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #0f172a;
}

::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
```

**Step 3: Test responsive design**

```bash
npm run dev
# Open http://localhost:5173 and test at different screen sizes
```

**Step 4: Commit**

```bash
git add apps/image-scout/
git commit -m "chore: add placeholder and enhance CSS styling"
```

---

### Task 9: Build & Deploy Setup

**Files:**
- Create: `apps/image-scout/.env.example`
- Create: `apps/image-scout/README.md`
- Modify: root `.gitignore`

**Step 1: Create .env.example**

```bash
# apps/image-scout/.env.example
VITE_GEMINI_API_KEY=your-key-here
VITE_CLOUDFLARE_ACCOUNT_ID=your-account-id
VITE_CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
VITE_CLOUDFLARE_R2_BUCKET_NAME=imagecdn
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://your-r2-url.r2.dev
```

**Step 2: Create README**

```markdown
# Image Scout — CDN Curation Tool

Standalone React app for searching images via Gemini, curating with rejection feedback, and uploading to Cloudflare R2.

## Setup

1. Copy `.env.example` to `.env.local` and fill in credentials
2. `npm install`
3. `npm run dev`

## Usage

1. Enter a search prompt (e.g., "vintage leather bags, studio photography")
2. Optionally upload a reference image
3. Click "Generate Images" — Gemini searches and returns 10 results
4. Review each image, edit metadata, select or reject
5. For rejected images, write a reason (this is feedback for prompt refinement)
6. Click "Upload Selected Images" to send to R2
7. Download the report to analyze rejection patterns

## Report

The generated report includes:
- ✅ Selected images + CDN URLs + metadata
- ❌ Rejected images + reasons (feedback for improving the search prompt)

Use rejection patterns to refine your Gemini image-scout system prompt for better future searches.

## Architecture

- Pure frontend (no backend)
- Calls Gemini API directly from browser
- Uploads directly to Cloudflare R2 (via AWS SDK)
- Report generated client-side

## Deployment

```bash
npm run build
# Output: dist/ folder
# Deploy to Vercel, Netlify, or any static host
```
```

**Step 3: Update .gitignore**

```bash
echo "apps/image-scout/.env.local" >> .gitignore
echo "apps/image-scout/dist/" >> .gitignore
echo "apps/image-scout/node_modules/" >> .gitignore
```

**Step 4: Final test**

```bash
npm run dev
# Verify all features work end-to-end
```

**Step 5: Commit**

```bash
git add apps/image-scout/
git commit -m "chore: add env template, README, update gitignore"
```

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| **Setup** | Project scaffold + Vite + React | 1 task |
| **APIs** | Gemini + R2 clients | 1 task |
| **UI** | Layout + search panel | 1 task |
| **Components** | Image grid + metadata editor | 1 task |
| **Review** | Review panel + report generation | 1 task |
| **Integration** | Gemini search + R2 upload | 1 task |
| **Polish** | Styling + deployment setup | 2 tasks |

**Total:** 9 tasks, ~6-8 hours for MVP

---

## Execution Options

Plan complete and saved to `docs/plans/2026-03-09-image-scout-cdn-tool.md`.

**Two execution options:**

**Option 1: Subagent-Driven (this session)**
- I dispatch fresh subagent per task, review between tasks
- Faster iteration, interactive refinement

**Option 2: Parallel Session (separate)**
- Open new Claude Code session with `superpowers:executing-plans`
- Haiku 4.5 executes all 9 tasks
- You can review when complete

**Which approach for Image Scout execution?**

(Note: Can also wait until after P4 Extended is fully complete if you prefer)
