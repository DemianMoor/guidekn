import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ACTIONS = ["publish", "unpublish", "delete"] as const;
type BulkAction = (typeof VALID_ACTIONS)[number];

const MAX_IDS_PER_REQUEST = 500;

/**
 * Apply an action to many picks in one shot. Caller sends:
 *   { action: "publish" | "unpublish" | "delete", ids: string[] }
 *
 * Returns:
 *   { ok: true, action, count }
 *
 * For "publish" we set status='published' on every selected pick AND set
 * published_at to now() ONLY for picks that don't already have one — so a
 * round-up that was previously published and unpublished keeps its original
 * publish date when re-published in bulk.
 *
 * "unpublish" wipes published_at along with status. "delete" relies on the
 * pick_products foreign-key cascade to remove products.
 */
export async function POST(req: NextRequest) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action as BulkAction;
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.ids)) {
    return NextResponse.json(
      { error: "ids must be an array of pick UUIDs" },
      { status: 400 }
    );
  }

  const ids = body.ids.filter(
    (id: unknown): id is string => typeof id === "string" && id.length > 0
  );

  if (ids.length === 0) {
    return NextResponse.json({ error: "No ids provided" }, { status: 400 });
  }

  if (ids.length > MAX_IDS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Too many ids. Max ${MAX_IDS_PER_REQUEST} per request.` },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  if (action === "delete") {
    const { error } = await supabase.from("picks").delete().in("id", ids);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action, count: ids.length });
  }

  if (action === "unpublish") {
    const { error } = await supabase
      .from("picks")
      .update({ status: "draft", published_at: null })
      .in("id", ids);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action, count: ids.length });
  }

  // action === "publish"
  // Step 1: bring everyone to published.
  const { error: statusError } = await supabase
    .from("picks")
    .update({ status: "published" })
    .in("id", ids);
  if (statusError) {
    return NextResponse.json({ error: statusError.message }, { status: 500 });
  }

  // Step 2: stamp published_at only on rows that don't have one yet.
  const { error: dateError } = await supabase
    .from("picks")
    .update({ published_at: new Date().toISOString() })
    .in("id", ids)
    .is("published_at", null);
  if (dateError) {
    return NextResponse.json({ error: dateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action, count: ids.length });
}
