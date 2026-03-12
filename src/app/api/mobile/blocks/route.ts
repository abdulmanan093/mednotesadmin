import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const year = req.nextUrl.searchParams.get("year");

    let query = supabaseAdmin
      .from("blocks")
      .select("*")
      .order("year")
      .order("name");

    if (year) {
      query = query.eq("year", parseInt(year, 10));
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ blocks: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
