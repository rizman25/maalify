import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_EMAILS = ["riza.developer25@gmail.com"];

export async function proxy(request: NextRequest) {
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

  const isAdminEmail = ADMIN_EMAILS.includes(user?.email ?? "");

  // ── Route categories ──────────────────────────────────────────────────
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/offline") ||
    pathname.startsWith("/guide");

  const isUserAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  // Admin login — siapa saja boleh akses tanpa login
  const isAdminLoginRoute = pathname === "/admin/login";

  // Halaman admin lainnya
  const isAdminRoute = pathname.startsWith("/admin") && !isAdminLoginRoute;

  // App routes (bukan admin, bukan public, bukan auth)
  const isAppRoute = !isAdminRoute && !isAdminLoginRoute && !isPublicRoute && !isUserAuthRoute;

  // ── Redirect logic ────────────────────────────────────────────────────

  // 1. Unauthenticated + akses admin route → /admin/login
  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // 2. Admin email + akses app routes → /admin (admin tidak boleh pakai app biasa)
  if (user && isAdminEmail && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // 3. Admin email + akses user auth routes → /admin
  if (user && isAdminEmail && isUserAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // 4. Unauthenticated + akses protected app route → /login
  if (!user && !isUserAuthRoute && !isPublicRoute && !isAdminLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 5. Already logged in (non-admin) + akses user auth route → /dashboard
  if (user && !isAdminEmail && isUserAuthRoute) {
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
