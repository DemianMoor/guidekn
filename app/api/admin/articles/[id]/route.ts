import { NextRequest, NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PILLARS } from "@/lib/brand-voice";

const VALID_PILLARS = Object.keys(PILLARS);
const VALID_STATUSES = ["draft", "scheduled", "published", "archived"];

// PATCH — update fields on an existing article
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Build the update — only include fields that were provided
  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.dek === "string") updates.dek = body.dek.trim();
  if (typeof body.body === "string") updates.body = body.body;
  if (typeof body.byline === "string") updates.byline = body.byline.trim();
  if (typeof body.image_url === "string" || body.image_url === null) {
    updates.image_url = body.image_url || null;
  }
  if (typeof body.image_alt === "string") updates.image_alt = body.image_alt;
  if (typeof body.image_credit === "string" || body.image_credit === null) {
    updates.image_credit = body.image_credit || null;
  }
  if (typeof body.seo_title === "string" || body.seo_title === null) {
    updates.seo_title = body.seo_title || null;
  }
  if (typeof body.seo_description === "string" || body.seo_description === null) {
    updates.seo_description = body.seo_description || null;
  }

  if (typeof body.pillar === "string") {
    if (!VALID_PILLARS.includes(body.pillar)) {
      return NextResponse.json({ error: "Invalid pillar." }, { status: 400 });
    }
    updates.pillar = body.pillar;
  }

  if (typeof body.status === "string") {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    updates.status = body.status;
  }

  // Handle scheduled/published timestamps
  if (body.published_at === null) {
    updates.published_at = null;
  } else if (typeof body.published_at === "string") {
    const date = new Date(body.published_at);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid publish date." },
        { status: 400 }
      );
    }
    updates.published_at = date.toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("articles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Article update error:", error);
    return NextResponse.json(
      { error: "Couldn't save the article. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, article: data });
}

// DELETE — remove an article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    console.error("Article delete error:", error);
    return NextResponse.json(
      { error: "Couldn't delete the article. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}