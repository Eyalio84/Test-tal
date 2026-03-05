"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"

export function AuthButtons() {
  const { data: session } = useSession()

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt=""
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <button
          onClick={() => signOut()}
          className="text-xs tracking-widest uppercase hover:opacity-60 transition"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="text-xs tracking-widest uppercase hover:opacity-60 transition"
    >
      Sign In
    </button>
  )
}
