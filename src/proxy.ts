import { NextResponse, type NextRequest } from "next/server";

const customerRoutes = ["/dashboard", "/profile"];
const obRoutes = ["/ob"];
const adminRoutes = ["/admin"];

function isProtected(pathname: string) {
  return (
    customerRoutes.some((r) => pathname.startsWith(r)) ||
    obRoutes.some((r) => pathname.startsWith(r)) ||
    adminRoutes.some((r) => pathname.startsWith(r))
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  const sessionRaw = request.cookies.get("session")?.value;
  const role: string | undefined = sessionRaw
    ? (JSON.parse(sessionRaw) as { role?: string }).role
    : undefined;

  // Unauthenticated on protected route → login
  if (!token && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // OB route — hanya role ob atau admin
  if (token && obRoutes.some((r) => pathname.startsWith(r))) {
    if (role !== "ob" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Admin route — hanya role admin
  if (token && adminRoutes.some((r) => pathname.startsWith(r))) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
