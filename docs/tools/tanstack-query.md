# TanStack Query — Server State Management

## What it is

A library for fetching, caching, and synchronising server data in React components.
It replaces the manual `useState + useEffect + fetch` pattern with a declarative
API that handles loading states, errors, caching, and automatic background refetching.

## Why it's in StoreKit

The admin media page previously fetched no data at all — it showed static theme
images from `THEMES` as defaults and relied on optimistic updates. With TanStack Query:

- On page load, it fetches the *actual* current R2 URLs from the DB
- After an upload, it automatically refreshes the grid without any manual state management
- If the fetch fails, it retries automatically
- If you switch between theme tabs, data for previously-viewed tabs is cached
  (no duplicate API calls)

## Config file

`components/layout/Providers.tsx` — `QueryClientProvider` wraps the whole app.

## QueryClient settings in StoreKit

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,  // data stays fresh for 60 seconds
    },
  },
})
```

`staleTime: 60000` means: after fetching media images, don't refetch for 60 seconds
even if the component re-mounts. This prevents hammering the DB on every tab switch.

Note: `queryClient` is declared at module level (outside the component). This is
intentional — one shared cache per browser session. If it were inside the component,
every re-render would create a new client and lose cached data.

## Usage: fetching data (useQuery)

```ts
const { data, isLoading, error } = useQuery<Record<string, string>>({
  queryKey: ["media-images", activeTheme],  // unique cache key
  queryFn:  () => fetch(`/api/media/images?themeId=${activeTheme}`).then(r => r.json()),
})
```

- `queryKey`: TanStack Query uses this as the cache identifier. If `activeTheme` changes,
  it fetches fresh data for the new theme.
- `data`: the fetched result (undefined while loading)
- `isLoading`: true during the first fetch

## Usage: mutations (useMutation)

```ts
const { mutate, isPending, variables } = useMutation({
  mutationFn: async ({ slot, file }: { slot: string; file: File }) => {
    // your upload fetch here
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["media-images", activeTheme] })
  },
})
```

After a successful upload, `invalidateQueries` marks the cached image list as stale,
causing an automatic background refetch that updates the grid.

## Where it's used in StoreKit

| File | Query key | What it fetches |
|------|-----------|-----------------|
| `app/admin/media/page.tsx` | `["media-images", themeId]` | R2 URLs for current theme from DB |

## DevTools

`ReactQueryDevtools` is included in `Providers.tsx` — a floating button appears in
the bottom-left corner in development. Click it to see:
- All active queries and their cache state
- Which queries are loading, stale, or fresh
- The actual data cached for each query

It disappears completely in production builds.

## Adding a new query

1. Create a GET API route in `app/api/`
2. Add a `useQuery` call in your component
3. Choose a unique `queryKey` (an array — first item is the "namespace", rest are parameters)

```ts
const { data: products } = useQuery({
  queryKey: ["products", themeId, page],
  queryFn:  () => fetch(`/api/products?themeId=${themeId}&page=${page}`).then(r => r.json()),
})
```
