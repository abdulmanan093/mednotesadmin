import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const device = body.device as
      | { model: string; os: string; platform: string }
      | undefined;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "No account found with this email. Please contact admin." },
        { status: 404 },
      );
    }

    if (user.status === "Disabled") {
      return NextResponse.json(
        { error: "Your account has been disabled. Please contact admin." },
        { status: 403 },
      );
    }

    const { data: blocks } = await supabaseAdmin
      .from("user_blocks")
      .select("block_id")
      .eq("user_id", user.id);

    // Check device restriction: if a device is already registered, only allow that same device
    if (device?.model && device?.platform) {
      const { data: existingDevice } = await supabaseAdmin
        .from("devices")
        .select("model, os, platform")
        .eq("user_id", user.id)
        .single();

      if (existingDevice && existingDevice.model !== device.model) {
        return NextResponse.json(
          {
            error:
              "This account is already registered on another device. Please contact admin to reset your device.",
          },
          { status: 403 },
        );
      }

      // Upsert device info
      await supabaseAdmin.from("devices").upsert(
        {
          user_id: user.id,
          model: device.model,
          os: device.os,
          platform: device.platform,
          last_seen: new Date().toISOString().split("T")[0],
        },
        { onConflict: "user_id" },
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        university: user.university,
        mbbs_year: user.mbbs_year,
        access_end: user.access_end,
        status: user.status,
        assignedBlocks: (blocks || []).map(
          (b: { block_id: string }) => b.block_id,
        ),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
