import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const publicRoutes = ["/login", "/unauthorized"];
  const isPublicRoute = publicRoutes.includes(pathname);

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/attendance");

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (isPublicRoute && isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/attendance/:path*", "/login"],
};