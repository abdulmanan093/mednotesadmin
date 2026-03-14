import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isoFromDateOnly(dateOnly: string): string {
  // dateOnly like "2026-03-15" → ISO at midnight UTC
  return `${dateOnly}T00:00:00.000Z`;
}

function pickLatestIso(candidates: Array<string | null | undefined>): string | null {
  let latest: string | null = null;
  for (const c of candidates) {
    if (!c) continue;
    const t = Date.parse(c);
    if (Number.isNaN(t)) continue;
    if (!latest) {
      latest = c;
      continue;
    }
    if (t > Date.parse(latest)) latest = c;
  }
  return latest;
}

export async function GET() {
  try {
    // Fast-path: once the admin app starts logging activity, this single query
    // is enough to detect content changes.
    const activityRes = await supabaseAdmin
      .from("activity_log")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    const activityTs = activityRes.data?.[0]?.created_at ?? null;

    // Counts change on DELETEs even if timestamps don't.
    const [blocksCountRes, subjectsCountRes, chaptersCountRes, notesCountRes] =
      await Promise.all([
        supabaseAdmin.from("blocks").select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("subjects")
          .select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("chapters")
          .select("id", { count: "exact", head: true }),
        supabaseAdmin.from("notes").select("id", { count: "exact", head: true }),
      ]);

    const countsSig = `b=${blocksCountRes.count ?? 0}|s=${subjectsCountRes.count ?? 0}|c=${chaptersCountRes.count ?? 0}|n=${notesCountRes.count ?? 0}`;

    if (activityTs) {
      return NextResponse.json(
        { version: `${activityTs}|${countsSig}` },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    // Fallback: if activity_log is empty (fresh project), derive a version
    // from the newest row timestamps.
    const [blocksRes, subjectsRes, chaptersRes, notesCreatedRes, notesUploadRes] =
      await Promise.all([
        supabaseAdmin
          .from("blocks")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1),
        supabaseAdmin
          .from("subjects")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1),
        supabaseAdmin
          .from("chapters")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1),
        supabaseAdmin
          .from("notes")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1),
        supabaseAdmin
          .from("notes")
          .select("upload_date")
          .order("upload_date", { ascending: false })
          .limit(1),
      ]);

    const latest = pickLatestIso([
      blocksRes.data?.[0]?.created_at,
      subjectsRes.data?.[0]?.created_at,
      chaptersRes.data?.[0]?.created_at,
      notesCreatedRes.data?.[0]?.created_at,
      notesUploadRes.data?.[0]?.upload_date
        ? isoFromDateOnly(notesUploadRes.data[0].upload_date)
        : null,
    ]);

    return NextResponse.json(
      { version: `${latest ?? "0"}|${countsSig}` },
      {
        headers: {
          // Always hit origin; this endpoint is used for change-detection
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
