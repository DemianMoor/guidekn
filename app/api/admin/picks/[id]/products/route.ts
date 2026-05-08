import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IncomingProduct = {
  id?: string;
  badge?: string;
  name?: string;
  brand?: string;
  image_url?: string;
  image_alt?: string;
  take?: string;
  pros?: unknown;
  cons?: unknown;
  specs?: unknown;
  retailer_name?: string;
  retailer_url?: string;
};

function cleanStringArray(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const cleaned = input
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return cleaned.length > 0 ? cleaned : null;
}

function cleanSpecs(input: unknown): Record<string, string> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const key = k.trim();
    const val = typeof v === "string" ? v.trim() : "";
    if (key && val) out[key] = val;
  }
  return Object.keys(out).length > 0 ? out : null;
}

// POST — sync the full product list for this pick.
// Deletes any product not in the incoming list, upserts the rest by id,
// rewrites positions in array order.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: pickId } = await ctx.params;
  const body = await req.json();
  const incoming: IncomingProduct[] = Array.isArray(body.products)
    ? body.products
    : [];

  const supabase = createSupabaseAdmin();

  // Verify the pick exists (so we don't half-process for a deleted pick)
  const { data: pickRow } = await supabase
    .from("picks")
    .select("id")
    .eq("id", pickId)
    .maybeSingle();
  if (!pickRow)
    return NextResponse.json({ error: "Pick not found" }, { status: 404 });

  // 1) Compute which existing rows to delete (IDs in DB but not in incoming).
  //    Fetching the existing IDs lets us do a clean .in("id", toDelete) call
  //    instead of building a SQL "not in (...)" string with quoted UUIDs.
  const { data: existing } = await supabase
    .from("pick_products")
    .select("id")
    .eq("pick_id", pickId);

  const incomingIds = new Set(
    incoming.filter((p) => typeof p.id === "string" && p.id).map((p) => p.id!)
  );
  const toDelete = (existing ?? [])
    .map((r) => r.id)
    .filter((id) => !incomingIds.has(id));

  if (toDelete.length > 0) {
    const { error: delErr } = await supabase
      .from("pick_products")
      .delete()
      .in("id", toDelete);
    if (delErr)
      return NextResponse.json(
        { error: `Delete failed: ${delErr.message}` },
        { status: 500 }
      );
  }

  // 2) Update existing / insert new, rewriting positions.
  for (let i = 0; i < incoming.length; i++) {
    const p = incoming[i];
    const name = (p.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: `Product at position ${i + 1} is missing a name` },
        { status: 400 }
      );
    }
    const row = {
      pick_id: pickId,
      position: i,
      badge: p.badge?.trim() || null,
      name,
      brand: p.brand?.trim() || null,
      image_url: p.image_url?.trim() || null,
      image_alt: p.image_alt?.trim() || null,
      take: typeof p.take === "string" ? p.take : "",
      pros: cleanStringArray(p.pros),
      cons: cleanStringArray(p.cons),
      specs: cleanSpecs(p.specs),
      retailer_name: p.retailer_name?.trim() || null,
      retailer_url: p.retailer_url?.trim() || null,
    };

    if (typeof p.id === "string" && p.id && incomingIds.has(p.id)) {
      const { error: updErr } = await supabase
        .from("pick_products")
        .update(row)
        .eq("id", p.id)
        .eq("pick_id", pickId);
      if (updErr)
        return NextResponse.json(
          { error: `Update failed for "${name}": ${updErr.message}` },
          { status: 500 }
        );
    } else {
      const { error: insErr } = await supabase
        .from("pick_products")
        .insert(row);
      if (insErr)
        return NextResponse.json(
          { error: `Insert failed for "${name}": ${insErr.message}` },
          { status: 500 }
        );
    }
  }

  // Bump pick.updated_at so the list view reflects changes
  await supabase
    .from("picks")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", pickId);

  return NextResponse.json({ ok: true, count: incoming.length });
}
