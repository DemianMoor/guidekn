import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";
import { detectChrome } from "@/lib/landing-page-chrome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE_PUBLIC_BASE =
  "https://bdhujqomjvfgzbgicwev.supabase.co/storage/v1/object/public/landing-pages";

// Preflight for the admin "use Guide Kin chrome" toggle: fetches the entry
// HTML and reports whether the heuristic was able to locate the partner's
// own header / footer. Save proceeds regardless — this is purely advisory.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: page } = await supabase
    .from("landing_pages")
    .select("entry_file")
    .eq("slug", slug)
    .maybeSingle();

  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entryUrl = `${STORAGE_PUBLIC_BASE}/${slug}/${page.entry_file}`;
  let html: string;
  try {
    const res = await fetch(entryUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Entry file fetch failed (${res.status}).` },
        { status: 502 }
      );
    }
    html = await res.text();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch entry file.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json(detectChrome(html));
}
