import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";
import { PILLARS } from "@/lib/brand-voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PILLARS = Object.keys(PILLARS);

// GET — fetch full pick with products
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const supabase = createSupabaseAdmin();

  const [{ data: pick }, { data: products }] = await Promise.all([
    supabase.from("picks").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("pick_products")
      .select("*")
      .eq("pick_id", id)
      .order("position", { ascending: true }),
  ]);

  if (!pick) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    pick: { ...pick, products: products ?? [] },
  });
}

// PATCH — update fields
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const updates: Record<string, unknown> = {};

  // Whitelisted text fields. Empty string trims to null EXCEPT title and
  // byline (required) — for those, blank is rejected up the stack but if
  // the field is sent, we keep it as a non-null trimmed string.
  const stringFields = [
    "title",
    "dek",
    "intro",
    "methodology",
    "hero_image_url",
    "hero_image_alt",
    "byline",
    "seo_title",
    "seo_description",
    "slug",
    "category",
  ];
  for (const f of stringFields) {
    if (typeof body[f] !== "string") continue;
    const trimmed = body[f].trim();
    // Title and byline are NOT NULL in the schema; treat blank as no-op.
    if ((f === "title" || f === "byline") && trimmed === "") continue;
    updates[f] = trimmed || null;
  }
  if (Array.isArray(body.pillars)) {
    updates.pillars = body.pillars.filter(
      (p: unknown) =>
        typeof p === "string" && VALID_PILLARS.includes(p as string)
    );
  }
  if (body.status === "draft" || body.status === "published") {
    updates.status = body.status;
    if (body.status === "published" && !body.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }
  if (typeof body.published_at === "string" && body.published_at !== "") {
    updates.published_at = body.published_at;
  }
  if (body.published_at === null) {
    updates.published_at = null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("picks")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ pick: data });
}

// DELETE — remove pick (products cascade via FK)
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("picks").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
