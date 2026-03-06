import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
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
