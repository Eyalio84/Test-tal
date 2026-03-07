import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getClientIp } from "@/lib/rateLimit"

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!rateLimit(ip, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const body = await req.json()
  const { name, email, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY

  if (apiKey) {
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(apiKey)

      await resend.emails.send({
        from: "Store Contact <onboarding@resend.dev>",
        to: "hello@store.com",
        subject: `Contact form: ${body.subject || "New message"} from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${body.subject ?? ""}\n\n${message}`,
      })
    } catch (err) {
      console.error("Resend error:", err)
      return NextResponse.json({ error: "Failed to send email." }, { status: 500 })
    }
  } else {
    // Dev mode: log to console
    console.log("[Contact Form]", { name, email, subject: body.subject, message })
  }

  return NextResponse.json({ success: true })
}
