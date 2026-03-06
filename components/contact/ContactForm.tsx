"use client"

import { useState } from "react"
import toast from "react-hot-toast"

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Message sent! We'll be in touch soon.")
        setForm({ name: "", email: "", subject: "", message: "" })
      } else {
        toast.error(data.error ?? "Something went wrong.")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-16">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="contact-name" className="block text-xs tracking-widest uppercase text-ink/50 mb-1.5">Name</label>
          <input id="contact-name" type="text" required value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-stone-200 px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition"
            placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs tracking-widest uppercase text-ink/50 mb-1.5">Email</label>
          <input id="contact-email" type="email" required value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full border border-stone-200 px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition"
            placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="contact-subject" className="block text-xs tracking-widest uppercase text-ink/50 mb-1.5">Subject</label>
          <select id="contact-subject" value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            className="w-full border border-stone-200 px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition bg-white">
            <option value="">Select a subject</option>
            <option value="order">Order inquiry</option>
            <option value="product">Product question</option>
            <option value="custom">Custom order</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-xs tracking-widest uppercase text-ink/50 mb-1.5">Message</label>
          <textarea id="contact-message" required rows={5} value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full border border-stone-200 px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition resize-none"
            placeholder="How can we help?" />
        </div>
        <button type="submit" disabled={loading}
          className="bg-ink text-white py-3 text-xs tracking-widest uppercase hover:bg-ink/80 transition disabled:opacity-50">
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>

      <div className="flex flex-col gap-8 text-sm text-ink/60">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">Address</p>
          <p>14 Artisan Lane</p><p>Tel Aviv, 6100001</p><p>Israel</p>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">Email</p>
          <a href="mailto:hello@store.com" className="hover:text-ink transition">hello@store.com</a>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">Phone</p>
          <p>+972 50 123 4567</p>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">Hours</p>
          <p>Monday - Friday: 9am - 6pm</p>
          <p>Saturday: 10am - 4pm</p>
          <p>Sunday: Closed</p>
        </div>
      </div>
    </div>
  )
}
