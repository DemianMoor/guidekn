import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";
import { PILLARS } from "@/lib/brand-voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PILLARS = Object.keys(PILLARS);
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,80}$/;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// GET — list all picks
export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("picks")
    .select(
      "id, slug, category, title, dek, status, pillars, published_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ picks: data ?? [] });
}

// POST — create a new pick
export async function POST(req: NextRequest) {
  const editor = await getCurrentEditor();
  if (!editor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = (body.title ?? "").trim();
  const category = ((body.category ?? "") as string).trim().toLowerCase();
  const slugInput = ((body.slug ?? "") as string).trim().toLowerCase();
  const slug = slugInput || slugify(title);
  const pillars: string[] = Array.isArray(body.pillars)
    ? body.pillars.filter(
        (p: unknown) => typeof p === "string" && VALID_PILLARS.includes(p as string)
      )
    : [];

  if (!title)
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  if (!category || !SLUG_REGEX.test(category)) {
    return NextResponse.json(
      {
        error:
          "Category must be lowercase letters, numbers, hyphens (e.g., 'skincare')",
      },
      { status: 400 }
    );
  }
  if (!slug || !SLUG_REGEX.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: existing } = await supabase
    .from("picks")
    .select("id")
    .eq("category", category)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: `A pick at /picks/${category}/${slug} already exists` },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("picks")
    .insert({
      title,
      slug,
      category,
      pillars,
      dek: body.dek?.trim() || null,
      intro: body.intro || null,
      methodology: body.methodology || null,
      hero_image_url: body.hero_image_url?.trim() || null,
      hero_image_alt: body.hero_image_alt?.trim() || null,
      byline: body.byline?.trim() || "The Guide Kin team",
      seo_title: body.seo_title?.trim() || null,
      seo_description: body.seo_description?.trim() || null,
      status: body.status === "published" ? "published" : "draft",
      published_at:
        body.status === "published" ? new Date().toISOString() : null,
      author_id: editor.id ?? null,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pick: data });
}
