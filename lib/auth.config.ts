import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAdminRoute = nextUrl.pathname.startsWith("/admin")
      if (isAdminRoute) {
        const email = auth?.user?.email
        return email === process.env.ADMIN_EMAIL
      }
      return true
    },
  },
  pages: { signIn: "/api/auth/signin" },
}
