import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BUNDLE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_FILE_COUNT = 200;

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,80}$/;

const MIME_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  map: "application/json; charset=utf-8",
};

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

export async function POST(req: NextRequest) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const entryFileOverride = (formData.get("entry_file") as string)?.trim();
  const file = formData.get("file");

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

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (file.size > MAX_BUNDLE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `Bundle too large. Max ${MAX_BUNDLE_SIZE_BYTES / 1024 / 1024} MB.`,
      },
      { status: 400 }
    );
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

  const isZip =
    file.name.toLowerCase().endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed";

  let filesToUpload: { path: string; data: Uint8Array; contentType: string }[];
  let detectedEntryFile = "index.html";

  if (isZip) {
    try {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      filesToUpload = [];

      let fileCount = 0;
      const entries = Object.entries(zip.files);

      for (const [path, zipEntry] of entries) {
        if (zipEntry.dir) continue;
        if (path.startsWith("__MACOSX/") || path.includes("/.DS_Store")) continue;
        if (fileCount >= MAX_FILE_COUNT) {
          return NextResponse.json(
            { error: `Too many files in zip. Max ${MAX_FILE_COUNT}.` },
            { status: 400 }
          );
        }

        const data = await zipEntry.async("uint8array");
        filesToUpload.push({
          path,
          data,
          contentType: getMimeType(path),
        });
        fileCount++;
      }

      // Strip common top-level folder if zip wraps everything in one
      const topLevels = new Set(filesToUpload.map((f) => f.path.split("/")[0]));
      if (
        topLevels.size === 1 &&
        filesToUpload.every((f) => f.path.includes("/"))
      ) {
        const prefix = [...topLevels][0] + "/";
        filesToUpload = filesToUpload.map((f) => ({
          ...f,
          path: f.path.substring(prefix.length),
        }));
      }

      // Reject any path that tries to traverse out of the bundle root
      const bad = filesToUpload.find(
        (f) =>
          f.path.includes("..") ||
          f.path.startsWith("/") ||
          f.path.startsWith("\\")
      );
      if (bad) {
        return NextResponse.json(
          { error: `Invalid file path in zip: "${bad.path}"` },
          { status: 400 }
        );
      }

      if (entryFileOverride) {
        detectedEntryFile = entryFileOverride;
      } else {
        const indexFile = filesToUpload.find(
          (f) => f.path === "index.html" || f.path === "index.htm"
        );
        if (indexFile) {
          detectedEntryFile = indexFile.path;
        } else {
          const firstHtml = filesToUpload.find((f) =>
            /^[^/]+\.html?$/i.test(f.path)
          );
          if (firstHtml) {
            detectedEntryFile = firstHtml.path;
          } else {
            return NextResponse.json(
              {
                error:
                  "No HTML entry file found in zip. Must contain index.html (or specify entry_file).",
              },
              { status: 400 }
            );
          }
        }
      }

      if (!filesToUpload.some((f) => f.path === detectedEntryFile)) {
        return NextResponse.json(
          { error: `Entry file "${detectedEntryFile}" not found in zip.` },
          { status: 400 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        {
          error: `Failed to read zip: ${
            err instanceof Error ? err.message : "unknown error"
          }`,
        },
        { status: 400 }
      );
    }
  } else {
    if (
      !file.name.toLowerCase().endsWith(".html") &&
      !file.name.toLowerCase().endsWith(".htm")
    ) {
      return NextResponse.json(
        {
          error:
            "Single-file uploads must be .html. For bundles with assets, upload a .zip.",
        },
        { status: 400 }
      );
    }
    const data = new Uint8Array(await file.arrayBuffer());
    // Force the stored filename to a safe, predictable name so partner bundles can't
    // smuggle a path into the bucket via the upload's File.name.
    const safeName = file.name
      .toLowerCase()
      .endsWith(".htm")
      ? "index.htm"
      : "index.html";
    filesToUpload = [
      {
        path: safeName,
        data,
        contentType: getMimeType(safeName),
      },
    ];
    detectedEntryFile = safeName;
  }

  // Upload all files
  const uploadResults: { path: string; success: boolean; error?: string }[] = [];
  for (const f of filesToUpload) {
    const storagePath = `${slug}/${f.path}`;
    const { error } = await supabase.storage
      .from("landing-pages")
      .upload(storagePath, f.data, {
        contentType: f.contentType,
        upsert: false,
      });

    if (error) {
      uploadResults.push({ path: f.path, success: false, error: error.message });
    } else {
      uploadResults.push({ path: f.path, success: true });
    }
  }

  const failedUploads = uploadResults.filter((r) => !r.success);
  if (failedUploads.length > 0) {
    const successfulPaths = uploadResults
      .filter((r) => r.success)
      .map((r) => `${slug}/${r.path}`);
    if (successfulPaths.length > 0) {
      await supabase.storage.from("landing-pages").remove(successfulPaths);
    }
    return NextResponse.json(
      {
        error: "One or more files failed to upload. No partial bundle was kept.",
        failures: failedUploads,
      },
      { status: 500 }
    );
  }

  const { error: dbError } = await supabase.from("landing_pages").insert({
    slug,
    title,
    description,
    entry_file: detectedEntryFile,
    is_active: true,
    created_by: editor.id,
  });

  if (dbError) {
    const allPaths = filesToUpload.map((f) => `${slug}/${f.path}`);
    await supabase.storage.from("landing-pages").remove(allPaths);
    return NextResponse.json(
      { error: `Database error: ${dbError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    slug,
    files_uploaded: filesToUpload.length,
    entry_file: detectedEntryFile,
    public_url: `/lp/${slug}`,
  });
}
