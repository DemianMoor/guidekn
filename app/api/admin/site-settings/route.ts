import { NextRequest, NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

const ALLOWED_KEYS = [
  "homepage_hero_image",
  "about_hero_image",
  "founder_name",
  "founder_title",
  "founder_bio",
  "founder_image",
];

export async function PATCH(request: NextRequest) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json();
  const updates = body as Record<string, string | null>;

  // Validate all keys
  for (const key of Object.keys(updates)) {
    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json(
        { error: `Invalid setting: ${key}` },
        { status: 400 }
      );
    }
  }

  const supabase = createSupabaseAdmin();

  // Upsert each setting
  const upserts = Object.entries(updates).map(([key, value]) => ({
    key,
    value,
    updated_by: editor.id,
  }));

  const { error } = await supabase
    .from("site_settings")
    .upsert(upserts, { onConflict: "key" });

  if (error) {
    console.error("Site settings update error:", error);
    return NextResponse.json(
      { error: "Couldn't save settings." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}