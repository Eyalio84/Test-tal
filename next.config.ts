import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  // Suppress verbose Sentry build output
  silent: true,
  // Disable source map upload (requires SENTRY_AUTH_TOKEN — add later when deploying)
  sourcemaps: { disable: true },
})
