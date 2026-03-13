"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export function CloneTemplateButton({ themeId }: { themeId: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!session?.user) return null

  async function handleClone() {
    setLoading(true)
    try {
      const res = await fetch("/api/sites/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId }),
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
      onClick={handleClone}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-stone-900 text-white text-sm px-6 py-3 rounded-lg hover:bg-stone-700 disabled:opacity-50 transition font-medium"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Cloning...
        </>
      ) : (
        "Use this template"
      )}
    </button>
  )
}
