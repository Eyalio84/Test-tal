import type { Metadata } from "next"
import { PageManagerClient } from "./PageManagerClient"

export const metadata: Metadata = {
  title: "Pages",
}

export default function PagesPage() {
  return <PageManagerClient />
}
