import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";
import { PILLARS } from "@/lib/brand-voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PILLARS = Object.keys(PILLARS);
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,80}$/;
const VALID_STATUSES = ["draft", "published"] as const;

type ImportRow = {
  // pick-level
  pick_category?: string;
  pick_slug?: string;
  pick_title?: string;
  pick_dek?: string;
  pick_intro_md?: string;
  pick_methodology_md?: string;
  pick_byline?: string;
  pick_pillars?: string;
  pick_hero_image_url?: string;
  pick_hero_image_alt?: string;
  pick_seo_title?: string;
  pick_seo_description?: string;
  pick_status?: string;
  pick_published_at?: string;
  // product-level
  position?: string;
  badge?: string;
  name?: string;
  brand?: string;
  image_url?: string;
  image_alt?: string;
  take?: string;
  pros?: string;
  cons?: string;
  specs?: string;
  retailer_name?: string;
  retailer_url?: string;
};

type RowResult =
  | {
      row: number;
      status: "imported";
      pick_slug: string;
      product_name: string;
    }
  | {
      row: number;
      status: "skipped";
      reason: string;
      pick_slug?: string;
      product_name?: string;
    }
  | {
      row: number;
      status: "error";
      reason: string;
      pick_slug?: string;
      product_name?: string;
    };

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

// Pipe-separated list helper. Trims, drops empty entries.
function parsePipeList(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Pipe-separated key=value pairs → object. Drops rows without an = or empty key.
function parseSpecs(input: string | undefined): Record<string, string> | null {
  if (!input) return null;
  const out: Record<string, string> = {};
  for (const part of input.split("|")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const k = trimmed.substring(0, eq).trim();
    const v = trimmed.substring(eq + 1).trim();
    if (k && v) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
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
    return NextResponse.json({ error: "CSV has no data rows." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const results: RowResult[] = [];

  // Pre-fetch existing (category, slug) pairs so we can skip duplicates without
  // a per-row roundtrip. The set's keys are "category::slug".
  const { data: existingRows } = await supabase
    .from("picks")
    .select("category, slug");
  const existingKeys = new Set(
    (existingRows ?? []).map(
      (r) => `${(r as { category: string }).category}::${(r as { slug: string }).slug}`
    )
  );

  // Group input rows by pick (category, slug). First row in each group is the
  // source of truth for pick-level fields; later rows of the same group only
  // contribute their product fields.
  type Group = {
    key: string;
    category: string;
    slug: string;
    pickRow: ImportRow;
    pickRowNumber: number;
    products: { row: ImportRow; rowNumber: number }[];
  };
  const groups: Group[] = [];
  const groupByKey = new Map<string, Group>();

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowNumber = i + 2; // +1 for header, +1 for 1-indexed display

    const category = (row.pick_category ?? "").trim().toLowerCase();
    const titleForSlug = (row.pick_title ?? "").trim();
    const slug = (row.pick_slug ?? "").trim().toLowerCase() || slugify(titleForSlug);

    if (!category || !slug) {
      results.push({
        row: rowNumber,
        status: "error",
        reason: "Missing pick_category or pick_slug (and no pick_title to derive slug)",
        product_name: row.name?.trim(),
      });
      continue;
    }

    const key = `${category}::${slug}`;
    let group = groupByKey.get(key);
    if (!group) {
      group = {
        key,
        category,
        slug,
        pickRow: row,
        pickRowNumber: rowNumber,
        products: [],
      };
      groupByKey.set(key, group);
      groups.push(group);
    }
    group.products.push({ row, rowNumber });
  }

  // Process groups: skip existing, validate, insert pick + products
  for (const group of groups) {
    // Skip if pick already exists
    if (existingKeys.has(group.key)) {
      for (const { rowNumber, row } of group.products) {
        results.push({
          row: rowNumber,
          status: "skipped",
          reason: `Pick /picks/${group.category}/${group.slug} already exists — skipped`,
          pick_slug: group.slug,
          product_name: row.name?.trim(),
        });
      }
      continue;
    }

    // Validate pick-level fields from the first row
    const pr = group.pickRow;
    const title = pr.pick_title?.trim();
    if (!title) {
      for (const { rowNumber, row } of group.products) {
        results.push({
          row: rowNumber,
          status: "error",
          reason: "Missing pick_title",
          pick_slug: group.slug,
          product_name: row.name?.trim(),
        });
      }
      continue;
    }

    if (!SLUG_REGEX.test(group.category)) {
      for (const { rowNumber, row } of group.products) {
        results.push({
          row: rowNumber,
          status: "error",
          reason: `Invalid pick_category "${group.category}" — lowercase letters, digits, hyphens only`,
          pick_slug: group.slug,
          product_name: row.name?.trim(),
        });
      }
      continue;
    }
    if (!SLUG_REGEX.test(group.slug)) {
      for (const { rowNumber, row } of group.products) {
        results.push({
          row: rowNumber,
          status: "error",
          reason: `Invalid pick_slug "${group.slug}" — lowercase letters, digits, hyphens only`,
          pick_slug: group.slug,
          product_name: row.name?.trim(),
        });
      }
      continue;
    }

    const pillarsRaw = parsePipeList(pr.pick_pillars);
    const invalidPillar = pillarsRaw.find(
      (p) => !VALID_PILLARS.includes(p.toLowerCase())
    );
    if (invalidPillar) {
      for (const { rowNumber, row } of group.products) {
        results.push({
          row: rowNumber,
          status: "error",
          reason: `Invalid pillar "${invalidPillar}". Must be one of: ${VALID_PILLARS.join(", ")}`,
          pick_slug: group.slug,
          product_name: row.name?.trim(),
        });
      }
      continue;
    }
    const pillars = pillarsRaw.map((p) => p.toLowerCase());

    const status = (pr.pick_status ?? "draft").trim().toLowerCase();
    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      for (const { rowNumber, row } of group.products) {
        results.push({
          row: rowNumber,
          status: "error",
          reason: `Invalid pick_status "${pr.pick_status}". Must be "draft" or "published"`,
          pick_slug: group.slug,
          product_name: row.name?.trim(),
        });
      }
      continue;
    }

    let publishedAt: string | null = null;
    if (pr.pick_published_at && pr.pick_published_at.trim()) {
      const t = Date.parse(pr.pick_published_at.trim());
      if (Number.isNaN(t)) {
        for (const { rowNumber, row } of group.products) {
          results.push({
            row: rowNumber,
            status: "error",
            reason: `Invalid pick_published_at "${pr.pick_published_at}". Use ISO 8601 (e.g. 2026-05-08T08:00:00Z)`,
            pick_slug: group.slug,
            product_name: row.name?.trim(),
          });
        }
        continue;
      }
      publishedAt = new Date(t).toISOString();
    } else if (status === "published") {
      publishedAt = new Date().toISOString();
    }

    // Insert the pick
    const { data: insertedPick, error: pickInsertError } = await supabase
      .from("picks")
      .insert({
        title,
        slug: group.slug,
        category: group.category,
        pillars,
        dek: pr.pick_dek?.trim() || null,
        intro: pr.pick_intro_md?.trim() || null,
        methodology: pr.pick_methodology_md?.trim() || null,
        hero_image_url: pr.pick_hero_image_url?.trim() || null,
        hero_image_alt: pr.pick_hero_image_alt?.trim() || null,
        byline: pr.pick_byline?.trim() || "The Guide Kin team",
        seo_title: pr.pick_seo_title?.trim() || null,
        seo_description: pr.pick_seo_description?.trim() || null,
        status,
        published_at: publishedAt,
        author_id: editor.id ?? null,
      })
      .select("id")
      .single();

    if (pickInsertError || !insertedPick) {
      for (const { rowNumber, row } of group.products) {
        results.push({
          row: rowNumber,
          status: "error",
          reason: `Failed to create pick: ${
            pickInsertError?.message ?? "no row returned"
          }`,
          pick_slug: group.slug,
          product_name: row.name?.trim(),
        });
      }
      continue;
    }
    const pickId = insertedPick.id;

    // Insert each product. Position falls back to array index when not given.
    for (let pi = 0; pi < group.products.length; pi++) {
      const { row, rowNumber } = group.products[pi];
      const productName = row.name?.trim();
      const take = (row.take ?? "").trim();

      if (!productName) {
        results.push({
          row: rowNumber,
          status: "error",
          reason: "Missing product name",
          pick_slug: group.slug,
        });
        continue;
      }
      if (!take) {
        results.push({
          row: rowNumber,
          status: "error",
          reason: `Missing product take for "${productName}"`,
          pick_slug: group.slug,
          product_name: productName,
        });
        continue;
      }

      let position = pi;
      if (row.position && row.position.trim()) {
        const parsed = Number.parseInt(row.position.trim(), 10);
        if (Number.isFinite(parsed)) position = parsed;
      }

      const pros = parsePipeList(row.pros);
      const cons = parsePipeList(row.cons);
      const specs = parseSpecs(row.specs);

      const { error: prodErr } = await supabase.from("pick_products").insert({
        pick_id: pickId,
        position,
        badge: row.badge?.trim() || null,
        name: productName,
        brand: row.brand?.trim() || null,
        image_url: row.image_url?.trim() || null,
        image_alt: row.image_alt?.trim() || null,
        take,
        pros: pros.length > 0 ? pros : null,
        cons: cons.length > 0 ? cons : null,
        specs,
        retailer_name: row.retailer_name?.trim() || null,
        retailer_url: row.retailer_url?.trim() || null,
      });

      if (prodErr) {
        results.push({
          row: rowNumber,
          status: "error",
          reason: `Failed to insert product: ${prodErr.message}`,
          pick_slug: group.slug,
          product_name: productName,
        });
        continue;
      }

      results.push({
        row: rowNumber,
        status: "imported",
        pick_slug: group.slug,
        product_name: productName,
      });
    }

    // Add to existing set so a duplicate group later in the same file
    // (e.g. a typo where the same slug appears twice) gets skipped.
    existingKeys.add(group.key);
  }

  const summary = {
    total: parsed.data.length,
    imported: results.filter((r) => r.status === "imported").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    picks_created: groups.filter(
      (g) =>
        // count groups that resulted in any imported product as picks_created
        results.some(
          (r) => r.status === "imported" && r.pick_slug === g.slug
        )
    ).length,
  };

  return NextResponse.json({ summary, results });
}
