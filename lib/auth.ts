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
        select: { subscriptionTier: true },
      })
      session.user.subscriptionTier = dbUser?.subscriptionTier ?? "free"
      return session
    },
  },
})
