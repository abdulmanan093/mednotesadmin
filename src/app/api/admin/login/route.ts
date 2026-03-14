import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ACCESS_COOKIE = "mn_admin_access_token";
const REFRESH_COOKIE = "mn_admin_refresh_token";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Supabase not configured (missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
      },
      { status: 500 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { ok: false, error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  const maxAge = Math.max(60, (data.session.expires_in ?? 3600) - 30);

  response.cookies.set({
    name: ACCESS_COOKIE,
    value: data.session.access_token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  response.cookies.set({
    name: REFRESH_COOKIE,
    value: data.session.refresh_token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
