"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export function StartBlankButton() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!session?.user) return null

  async function handleBlank() {
    setLoading(true)
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Home", slug: "home" }),
      })
      if (res.ok) {
        router.push("/pages")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBlank}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-white text-stone-700 text-sm px-6 py-3 rounded-lg border border-stone-300 hover:bg-stone-50 disabled:opacity-50 transition font-medium"
    >
      {loading ? "Creating..." : "Start blank"}
    </button>
  )
}
