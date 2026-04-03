import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Public files served as-is (extension in path). */
const PUBLIC_FILE = /\.(?:ico|png|jpe?g|gif|webp|avif|svg|woff2?|txt|xml|json|webmanifest|map)$/i;

/**
 * Mobile Safari (and some proxies) cache HTML aggressively. After a deploy, users can see an old
 * shell until they hard-refresh. Hashed assets under `/_next/static` stay long-cache; this only
 * nudges document responses to revalidate.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next/static") || pathname.startsWith("/_next/image")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-cache, must-revalidate");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
