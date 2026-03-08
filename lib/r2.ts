import { S3Client } from "@aws-sdk/client-s3"
import { env } from "@/env"

// R2 is S3-compatible — use the standard AWS SDK pointed at Cloudflare's endpoint.
// Never import this file client-side.
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET     = env.CLOUDFLARE_R2_BUCKET_NAME
export const R2_PUBLIC_URL = env.CLOUDFLARE_R2_PUBLIC_URL

/** Canonical R2 object key for a theme image slot */
export function r2Key(themeId: string, slot: string, ext = "jpg"): string {
  return `themes/${themeId}/${slot}.${ext}`
}

/** Full public URL for an R2 object key */
export function r2Url(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}
