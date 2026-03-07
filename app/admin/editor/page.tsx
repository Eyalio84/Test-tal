import { redirect }   from "next/navigation"
import { auth }        from "@/lib/auth"
import { prisma }      from "@/lib/db"
import { EditorClient } from "./EditorClient"

export const metadata = { title: "Site Editor" }

export default async function EditorPage() {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) redirect("/admin")

  const rows = await prisma.siteContent.findMany()
  const initialDraft: Record<string, string> = {}
  for (const row of rows) initialDraft[row.id] = row.draft

  return <EditorClient initialDraft={initialDraft} />
}
