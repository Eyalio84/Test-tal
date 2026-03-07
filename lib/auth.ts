import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    // NOTE: do NOT spread authConfig.callbacks here — `authorized` is unused (no edge middleware)
    async session({ session, user }) {
      session.user.id = user.id
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { subscriptionTier: true, sites: { select: { id: true }, take: 1 } },
      })
      session.user.subscriptionTier = dbUser?.subscriptionTier ?? "free"
      // Auto-provision a site on first login
      if (dbUser && dbUser.sites.length === 0) {
        await prisma.site.create({
          data: {
            name:     "My Site",
            themeId:  "jewelry",
            ownerId:  user.id,
            plan:     dbUser.subscriptionTier ?? "starter",
          },
        })
      }
      return session
    },
  },
})
