import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // ── Route categories ──────────────────────────────────────────────────
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/auth") ||      // Supabase auth callbacks
    pathname.startsWith("/join") ||      // Household invite links
    pathname.startsWith("/offline");

  const isUserAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  // Admin login page — siapa saja boleh akses (belum login pun)
  const isAdminLoginRoute = pathname === "/admin/login";

  // Halaman admin lainnya (bukan /admin/login)
  const isAdminRoute =
    pathname.startsWith("/admin") && !isAdminLoginRoute;

  // ── Redirect logic ────────────────────────────────────────────────────

  // 1. Unauthenticated: akses admin route → /admin/login
  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // 2. Unauthenticated: akses protected app route → /login
  if (!user && !isUserAuthRoute && !isPublicRoute && !isAdminLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 3. Already logged in: akses user auth route → /dashboard
  if (user && isUserAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
