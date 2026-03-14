import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
// Signed URLs valid for 6 hours — long enough that users won't expire mid-session
const SIGNED_URL_EXPIRY = 60 * 60 * 6;

export async function GET() {
  try {
    // Fetch everything in parallel — one round-trip to Supabase
    const [blocksRes, subjectsRes, chaptersRes, notesRes] = await Promise.all([
      supabaseAdmin.from("blocks").select("*").order("year").order("name"),
      supabaseAdmin.from("subjects").select("*").order("name"),
      supabaseAdmin.from("chapters").select("*").order("name"),
      supabaseAdmin.from("notes").select("*").order("pdf_file_name"),
    ]);

    if (blocksRes.error) throw blocksRes.error;

    const notes = notesRes.data || [];

    // Generate presigned URLs for all notes in parallel
    const notesWithUrls = await Promise.all(
      notes.map(async (note) => {
        if (!note.pdf_file_key) return { ...note, pdf_url: null };
        try {
          const url = await getSignedUrl(
            R2,
            new GetObjectCommand({ Bucket: BUCKET, Key: note.pdf_file_key }),
            { expiresIn: SIGNED_URL_EXPIRY },
          );
          return { ...note, pdf_url: url };
        } catch {
          return { ...note, pdf_url: null };
        }
      }),
    );

    return NextResponse.json(
      {
        blocks: blocksRes.data || [],
        subjects: subjectsRes.data || [],
        chapters: chaptersRes.data || [],
        notes: notesWithUrls,
      },
      {
        headers: {
          // Cache at Vercel edge for 5 minutes; stale-while-revalidate for 10 minutes
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
