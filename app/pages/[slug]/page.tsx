import type { Metadata } from "next"
import { PageEditorClient } from "./PageEditorClient"

export const metadata: Metadata = {
  title: "Edit Page",
}

export default function PageEditorPage() {
  return <PageEditorClient />
}
