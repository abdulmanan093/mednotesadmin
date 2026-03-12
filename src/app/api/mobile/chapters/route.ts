import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const subjectId = req.nextUrl.searchParams.get("subject_id");

    if (!subjectId) {
      return NextResponse.json(
        { error: "subject_id is required" },
        { status: 400 },
      );
    }

    const [subjectRes, chaptersRes, notesRes] = await Promise.all([
      supabaseAdmin.from("subjects").select("*").eq("id", subjectId).single(),
      supabaseAdmin
        .from("chapters")
        .select("*")
        .eq("subject_id", subjectId)
        .order("name"),
      supabaseAdmin
        .from("notes")
        .select("*")
        .eq("subject_id", subjectId)
        .order("pdf_file_name"),
    ]);

    if (subjectRes.error) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Return notes with keys — mobile app will construct proxy URLs
    const notesWithUrls = (notesRes.data || []).map((note) => ({
      ...note,
      pdf_url: note.pdf_file_key || null,
    }));

    return NextResponse.json({
      subject: subjectRes.data,
      chapters: chaptersRes.data || [],
      notes: notesWithUrls,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
