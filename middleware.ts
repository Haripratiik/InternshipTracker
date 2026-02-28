import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/session";

const protectedPaths = [
  "/dashboard",
  "/tracker",
  "/calendar",
  "/companies",
  "/analytics",
  "/assistant",
  "/settings",
];

const protectedApiPrefixes = ["/api/jobs", "/api/scrape", "/api/cover-letter"];

function isProtected(pathname: string): boolean {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isProtectedApi(pathname: string): boolean {
  return protectedApiPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const session = cookie ? await verifySessionToken(cookie) : null;

  if (isProtectedApi(pathname)) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isProtected(pathname)) {
    if (!session) {
      const signIn = new URL("/", request.url);
      signIn.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
