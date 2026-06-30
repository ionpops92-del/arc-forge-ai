import { NextResponse, type NextRequest } from "next/server"
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/constants"

const PUBLIC_ROUTES = ["/sign-in", "/sign-up"]

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/") || isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/editor")) {
    const hasSessionCookie = request.cookies.has(AUTH_SESSION_COOKIE_NAME)

    if (!hasSessionCookie) {
      const signInUrl = new URL("/sign-in", request.url)
      signInUrl.searchParams.set("redirect_url", request.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
