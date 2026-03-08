import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { env } from "@/env"

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId:     env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
}
