import { NextResponse } from "next/server";

const ACCESS_COOKIE = "mn_admin_access_token";
const REFRESH_COOKIE = "mn_admin_refresh_token";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
