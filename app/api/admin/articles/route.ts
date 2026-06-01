import { NextRequest, NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PILLARS, type PillarSlug } from "@/lib/brand-voice";

const VALID_PILLARS = Object.keys(PILLARS) as PillarSlug[];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// POST — create a blank draft manually (no AI). Returns the new article so the
// client can redirect into the full editor.
export async function POST(request: NextRequest) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = (body?.title ?? "").toString().trim();
  const pillar = (body?.pillar ?? "").toString().trim();

  if (!title) {
    return NextResponse.json(
      { error: "Please give the article a title." },
      { status: 400 }
    );
  }

  if (!VALID_PILLARS.includes(pillar as PillarSlug)) {
    return NextResponse.json(
      { error: "Please pick a valid pillar." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  // Generate a unique slug — append a number if the base is taken.
  const base = slugify(title) || "untitled-draft";
  let slug = base;
  let attempt = 0;
  while (attempt < 5) {
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${base}-${attempt + 1}`;
  }

  const { data: article, error: dbError } = await supabase
    .from("articles")
    .insert({
      title,
      slug,
      pillar,
      dek: "",
      body: "",
      byline: editor.display_name,
      author_id: editor.id,
      image_alt: "",
      status: "draft",
    })
    .select()
    .single();

  if (dbError) {
    console.error("Failed to create manual draft:", dbError);
    return NextResponse.json(
      { error: "Couldn't create the draft. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, article });
}
