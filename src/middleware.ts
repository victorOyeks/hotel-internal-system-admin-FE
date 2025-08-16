import { type NextRequest, NextResponse } from "next/server";
import { paths } from "@/lib/shared";
import { $fetch } from "@/lib/fetch";
import { fromPromise } from "neverthrow";

const TOKEN_KEY = "hms.jwt.session_token";

// Define protected routes explicitly for clarity.
// This assumes `paths` contains role-based routes like: { owner: '/owner', admin: '/admin' }
const protectedPages = Object.values(paths);

export const config = {
  // Run middleware on all paths except for static assets and API routes.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_KEY)?.value;

  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    if (!token) {
      // User has no token and is on the auth page, let them proceed.
      // This is the key fix to prevent the redirect loop.
      return NextResponse.next();
    }

    // User has a token, let's verify it to see if we should redirect them.
    const result = await fromPromise(
      $fetch("@get/api/users/me", { auth: { type: "Bearer", token } }),
      (e) => e as Error
    );

    if (result.isOk() && result.value.data) {
      // Token is valid, redirect logged-in user to their dashboard.
      const userRole = result.value.data.data.role;
      const dashboardUrl = paths[userRole] || "/"; // Fallback to home
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    
    // Token is invalid or expired. Clear the bad cookie and let them stay on the auth page.
    const response = NextResponse.next();
    response.cookies.delete(TOKEN_KEY);
    return response;
  }

  if (!token) {
    // No token, redirect to the login page with a 'from' parameter.
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const result = await fromPromise(
    $fetch("@get/api/users/me", { auth: { type: "Bearer", token } }),
    (e) => e as Error
  );

  if (result.isErr() || result.value.error) {
    const loginUrl = new URL("/auth", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(TOKEN_KEY);
    return response;
  }

  const isCorrectlyRouted = protectedPages.some((p) => pathname.startsWith(p));
  if (!isCorrectlyRouted && result.value.data) {
      const userRole = result.value.data.data.role;
      const correctPath = paths[userRole];
      return NextResponse.rewrite(new URL(`${correctPath}${pathname}`, request.url));
  }

  return NextResponse.next();
}