import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.description === "string")
    updates.description = body.description.trim() || null;
  if (typeof body.entry_file === "string")
    updates.entry_file = body.entry_file.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("landing_pages")
    .update(updates)
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const supabase = createSupabaseAdmin();

  const { data: files, error: listError } = await supabase.storage
    .from("landing-pages")
    .list(slug, { limit: 1000 });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  if (files && files.length > 0) {
    const pathsToRemove = files.map((f) => `${slug}/${f.name}`);
    const { error: removeError } = await supabase.storage
      .from("landing-pages")
      .remove(pathsToRemove);
    if (removeError) {
      return NextResponse.json(
        { error: removeError.message },
        { status: 500 }
      );
    }
  }

  const { error: dbError } = await supabase
    .from("landing_pages")
    .delete()
    .eq("slug", slug);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
