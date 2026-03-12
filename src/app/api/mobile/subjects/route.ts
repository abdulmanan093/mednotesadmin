import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const blockId = req.nextUrl.searchParams.get("block_id");

    if (!blockId) {
      return NextResponse.json(
        { error: "block_id is required" },
        { status: 400 },
      );
    }

    const [blockRes, subjectsRes] = await Promise.all([
      supabaseAdmin.from("blocks").select("*").eq("id", blockId).single(),
      supabaseAdmin
        .from("subjects")
        .select("*")
        .eq("block_id", blockId)
        .order("name"),
    ]);

    if (blockRes.error) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    return NextResponse.json({
      block: blockRes.data,
      subjects: subjectsRes.data || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
