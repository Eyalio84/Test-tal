import { NextResponse, type NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    const email = token?.email as string | undefined
    if (!token || email !== process.env.ADMIN_EMAIL) {
      // Redirect anonymous users to sign-in; wrong-account users to home
      const dest = !token ? "/api/auth/signin" : "/"
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ["/admin/:path*"] }
