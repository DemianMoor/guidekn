import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,80}$/;

/**
 * Creates a landing_pages row without uploading any files. The client
 * uploads files individually to /[slug]/files. This sidesteps Vercel's
 * 4.5 MB request body limit on serverless functions, which prevents
 * shipping a multi-file bundle through a single endpoint.
 */
export async function POST(req: NextRequest) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    slug?: string;
    title?: string;
    description?: string | null;
    entry_file?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = body.slug?.trim().toLowerCase();
  const title = body.title?.trim();
  const description = body.description?.trim() || null;
  const entry_file = body.entry_file?.trim() || "index.html";

  if (!slug || !SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      {
        error:
          "Invalid slug. Use lowercase letters, numbers, and hyphens only. Max 80 chars.",
      },
      { status: 400 }
    );
  }

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: existing } = await supabase
    .from("landing_pages")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: `Slug "${slug}" already exists. Pick another or delete the existing page first.`,
      },
      { status: 409 }
    );
  }

  const { error: dbError } = await supabase.from("landing_pages").insert({
    slug,
    title,
    description,
    entry_file,
    is_active: true,
    created_by: editor.id,
  });

  if (dbError) {
    return NextResponse.json(
      { error: `Database error: ${dbError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    slug,
    entry_file,
    public_url: `/lp/${slug}`,
  });
}
