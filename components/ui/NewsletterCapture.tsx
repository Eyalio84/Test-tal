"use client"

import { useState } from "react"
import toast from "react-hot-toast"

export function NewsletterCapture() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success || data.message === "Already subscribed") {
        toast.success("You're on the list — thank you.")
        setEmail("")
      } else {
        toast.error(data.error ?? "Something went wrong")
      }
    } catch {
      toast.error("Couldn't subscribe — try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 min-w-0">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 min-w-0 bg-white/10 border border-white/20 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/60"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-white text-ink px-4 py-2 text-xs tracking-widest uppercase hover:bg-stone-100 transition flex-shrink-0 whitespace-nowrap disabled:opacity-50"
      >
        {loading ? "..." : "Subscribe"}
      </button>
    </form>
  )
}
