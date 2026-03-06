import type { Metadata } from "next"
import { ContactForm } from "@/components/contact/ContactForm"

export const metadata: Metadata = { title: "Contact" }

export default function ContactPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-ink mb-2">Get in touch</h1>
        <p className="text-ink/50 text-sm mb-12">
          We&apos;d love to hear from you.
        </p>
        <ContactForm />
      </div>
    </div>
  )
}
