import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PILLARS = ["body", "mind", "glow", "roam", "bonds", "years"] as const;
const VALID_STATUSES = ["draft", "published"] as const;

type ImportRow = {
  title?: string;
  slug?: string;
  pillar?: string;
  dek?: string;
  body?: string;
  byline?: string;
  image_url?: string;
  image_alt?: string;
  image_credit?: string;
  image_search_terms?: string;
  seo_title?: string;
  seo_description?: string;
  status?: string;
  published_at?: string;
};

type RowResult =
  | { row: number; status: "imported"; title: string; slug: string }
  | { row: number; status: "skipped"; reason: string; title?: string }
  | { row: number; status: "error"; reason: string; title?: string };

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

function validateRow(
  row: ImportRow,
  rowNumber: number
): { ok: true; data: Required<Omit<ImportRow, "image_url" | "image_alt" | "image_credit" | "image_search_terms" | "published_at" | "slug" | "byline" | "seo_title" | "seo_description">> & ImportRow } | { ok: false; reason: string } {
  const title = row.title?.trim();
  if (!title) return { ok: false, reason: "Missing title" };

  const pillar = row.pillar?.trim().toLowerCase();
  if (!pillar) return { ok: false, reason: "Missing pillar" };
  if (!VALID_PILLARS.includes(pillar as (typeof VALID_PILLARS)[number])) {
    return {
      ok: false,
      reason: `Invalid pillar "${pillar}". Must be one of: ${VALID_PILLARS.join(", ")}`,
    };
  }

  const dek = row.dek?.trim();
  if (!dek) return { ok: false, reason: "Missing dek" };

  const body = row.body?.trim();
  if (!body) return { ok: false, reason: "Missing body" };

  const status = row.status?.trim().toLowerCase();
  if (!status) return { ok: false, reason: "Missing status" };
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return {
      ok: false,
      reason: `Invalid status "${status}". Must be "draft" or "published"`,
    };
  }

  // Validate published_at if provided
  if (row.published_at && row.published_at.trim()) {
    const parsed = Date.parse(row.published_at.trim());
    if (Number.isNaN(parsed)) {
      return {
        ok: false,
        reason: `Invalid published_at "${row.published_at}". Use ISO 8601 (e.g. 2026-05-06T08:00:00Z)`,
      };
    }
  }

  return {
    ok: true,
    data: {
      ...row,
      title,
      pillar,
      dek,
      body,
      status,
    },
  };
}

export async function POST(req: NextRequest) {
  // Auth check
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded. Send a CSV in form field 'file'." },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Max 5MB." },
      { status: 400 }
    );
  }

  const text = await file.text();
  const parsed = Papa.parse<ImportRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      {
        error: "CSV parse error",
        details: parsed.errors.slice(0, 5).map((e) => ({
          row: e.row,
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  if (parsed.data.length === 0) {
    return NextResponse.json(
      { error: "CSV has no data rows." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const results: RowResult[] = [];

  // Get all existing slugs once for duplicate check
  const { data: existingSlugRows } = await supabase
    .from("articles")
    .select("slug");
  const existingSlugs = new Set(
    (existingSlugRows ?? []).map((r) => r.slug as string)
  );

  // Track slugs we generate within this import batch so we don't collide
  const slugsThisBatch = new Set<string>();

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowNumber = i + 2; // +1 for header, +1 for 1-indexed display

    const validation = validateRow(row, rowNumber);
    if (!validation.ok) {
      results.push({
        row: rowNumber,
        status: "error",
        reason: validation.reason,
        title: row.title,
      });
      continue;
    }

    const data = validation.data;

    // Determine slug
    let slug = data.slug?.trim() || slugify(data.title!);
    if (!slug) {
      results.push({
        row: rowNumber,
        status: "error",
        reason: "Could not generate slug from title",
        title: data.title,
      });
      continue;
    }

    // Skip on duplicate (within DB or within this batch)
    if (existingSlugs.has(slug) || slugsThisBatch.has(slug)) {
      results.push({
        row: rowNumber,
        status: "skipped",
        reason: `Slug "${slug}" already exists`,
        title: data.title,
      });
      continue;
    }

    // Determine published_at
    let publishedAt: string | null = null;
    if (data.published_at && data.published_at.trim()) {
      publishedAt = new Date(data.published_at.trim()).toISOString();
    } else if (data.status === "published") {
      publishedAt = new Date().toISOString();
    }

    const insertPayload = {
      title: data.title,
      slug,
      pillar: data.pillar,
      dek: data.dek,
      body: data.body,
      byline: data.byline?.trim() || "The Guide Kin team",
      image_url: data.image_url?.trim() || null,
      image_alt: data.image_alt?.trim() || null,
      image_credit: data.image_credit?.trim() || null,
      image_search_terms: data.image_search_terms?.trim() || null,
      seo_title: data.seo_title?.trim() || data.title,
      seo_description: data.seo_description?.trim() || data.dek,
      status: data.status,
      published_at: publishedAt,
      author_id: editor.id ?? null,
    };

    const { error: insertError } = await supabase
      .from("articles")
      .insert(insertPayload);

    if (insertError) {
      results.push({
        row: rowNumber,
        status: "error",
        reason: `Database error: ${insertError.message}`,
        title: data.title,
      });
      continue;
    }

    slugsThisBatch.add(slug);
    results.push({
      row: rowNumber,
      status: "imported",
      title: data.title!,
      slug,
    });
  }

  const summary = {
    total: parsed.data.length,
    imported: results.filter((r) => r.status === "imported").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ summary, results });
}