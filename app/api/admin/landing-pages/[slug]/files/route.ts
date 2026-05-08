import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  mp4: "video/mp4",
  pdf: "application/pdf",
};

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const formData = await req.formData();
  const file = formData.get("file");
  const targetPath = (formData.get("path") as string)?.trim();

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

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

  const data = new Uint8Array(await file.arrayBuffer());
  const fullPath = `${slug}/${targetPath}`;

  const { error } = await supabase.storage
    .from("landing-pages")
    .upload(fullPath, data, {
      contentType: getMimeType(targetPath),
      upsert: true,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("landing_pages")
    .update({ updated_at: new Date().toISOString() })
    .eq("slug", slug);

  return NextResponse.json({ success: true, path: fullPath });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const recursive = req.nextUrl.searchParams.get("recursive") === "true";
  const supabase = createSupabaseAdmin();

  if (!recursive) {
    const { data: files, error } = await supabase.storage
      .from("landing-pages")
      .list(slug, {
        limit: 1000,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ files: files ?? [] });
  }

  // Walk subfolders. Supabase Storage returns folder placeholders with a null
  // metadata field; real files have a metadata object with size/mimetype.
  type FlatFile = { path: string; size: number; contentType?: string };
  const out: FlatFile[] = [];

  async function walk(prefix: string): Promise<void> {
    const full = prefix ? `${slug}/${prefix}` : slug;
    const { data: items, error: listError } = await supabase.storage
      .from("landing-pages")
      .list(full, {
        limit: 1000,
        sortBy: { column: "name", order: "asc" },
      });
    if (listError) {
      throw new Error(listError.message);
    }
    for (const item of items ?? []) {
      const childPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.metadata) {
        out.push({
          path: childPath,
          size: (item.metadata as { size?: number }).size ?? 0,
          contentType: (item.metadata as { mimetype?: string }).mimetype,
        });
      } else {
        await walk(childPath);
      }
    }
  }

  try {
    await walk("");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "List failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ files: out });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const targetPath = req.nextUrl.searchParams.get("path");

  if (!targetPath) {
    return NextResponse.json(
      { error: "Path query param required" },
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
  const { error } = await supabase.storage
    .from("landing-pages")
    .remove([`${slug}/${targetPath}`]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
