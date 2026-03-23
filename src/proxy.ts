import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const pathname = req.nextUrl.pathname;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname.startsWith("/login");
  const isChangePasswordRoute = pathname.startsWith("/dashboard/change-password");

  if (!isLoggedIn && isDashboardRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isLoginRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const mustChangePassword = req.auth?.user?.mustChangePassword === true;

  if (
    isLoggedIn &&
    mustChangePassword &&
    isDashboardRoute &&
    !isChangePasswordRoute
  ) {
    return NextResponse.redirect(new URL("/dashboard/change-password", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};