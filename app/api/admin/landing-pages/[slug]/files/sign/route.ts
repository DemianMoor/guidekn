import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns a one-time-use Supabase Storage signed upload URL so the browser
 * can PUT the file directly to Supabase, bypassing Vercel's 4.5 MB request
 * body limit on serverless functions. The signed URL is bound to a specific
 * path within the bucket and expires after a single use.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  let body: { path?: string; upsert?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const targetPath = body.path?.trim();
  if (!targetPath) {
    return NextResponse.json(
      { error: "Target path required" },
      { status: 400 }
    );
  }
  if (
    targetPath.includes("..") ||
    targetPath.startsWith("/") ||
    targetPath.startsWith("\\")
  ) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: page } = await supabase
    .from("landing_pages")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!page) {
    return NextResponse.json(
      { error: "Landing page not found" },
      { status: 404 }
    );
  }

  const fullPath = `${slug}/${targetPath}`;
  const { data, error } = await supabase.storage
    .from("landing-pages")
    .createSignedUploadUrl(fullPath, { upsert: body.upsert === true });

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to sign upload URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  });
}
