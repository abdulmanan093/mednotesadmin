import { NextResponse } from "next/server";

const COOKIE_NAME = "mn_admin_session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
