import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "mn_admin_access_token";
const REFRESH_COOKIE = "mn_admin_refresh_token";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

async function fetchSupabaseUser(url: string, anonKey: string, accessToken: string) {
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.ok;
}

async function refreshSupabaseSession(url: string, anonKey: string, refreshToken: string) {
  const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as any;
  if (!data?.access_token || !data?.refresh_token) return null;
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
    expires_in: (data.expires_in as number | undefined) ?? 3600,
  };
}

export async function middleware(request: NextRequest) {
  const sb = getSupabaseConfig();
  if (!sb) return redirectToLogin(request);

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const ok = await fetchSupabaseUser(sb.url, sb.anonKey, accessToken);
    if (ok) return NextResponse.next();
  }

  if (refreshToken) {
    const refreshed = await refreshSupabaseSession(sb.url, sb.anonKey, refreshToken);
    if (refreshed) {
      const response = NextResponse.next();
      const maxAge = Math.max(60, refreshed.expires_in - 30);
      response.cookies.set({
        name: ACCESS_COOKIE,
        value: refreshed.access_token,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge,
      });
      response.cookies.set({
        name: REFRESH_COOKIE,
        value: refreshed.refresh_token,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }
  }

  return redirectToLogin(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
