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

  const isAdminLoginRoute = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin") && !isAdminLoginRoute;

  // ── Redirect logic ────────────────────────────────────────────────────

  // 1. /admin/login
  //    - Belum login → boleh akses (halaman login admin)
  //    - Sudah login sebagai admin → redirect ke /admin (sudah masuk)
  //    - Sudah login bukan admin → redirect ke /dashboard
  if (isAdminLoginRoute) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminEmail ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse; // belum login → izinkan akses halaman admin login
  }

  // 2. /admin/* — hanya untuk admin email yang sudah login
  if (isAdminRoute && (!user || !isAdminEmail)) {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  // 3. Unauthenticated + akses protected app route → /login
  if (!user && !isUserAuthRoute && !isPublicRoute && !isAdminLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 4. Already logged in + akses user auth route → /dashboard
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
