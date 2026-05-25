import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getCurrentEditor } from "@/lib/admin-auth";
import { effectiveChromeState } from "@/lib/landing-page-chrome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allowed values for the auto-revert dropdown. Stored as hours; null means
// permanent (no revert scheduled).
const ALLOWED_DEADLINE_HOURS = new Set([
  1, 2, 3, 4, 5, 6, 12, 24, 48, 72, 168,
]);

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.description === "string")
    updates.description = body.description.trim() || null;
  if (typeof body.entry_file === "string")
    updates.entry_file = body.entry_file.trim();

  const wantsChromeChange =
    typeof body.use_site_chrome === "boolean" ||
    body.cancel_revert === true;

  const supabase = createSupabaseAdmin();

  if (wantsChromeChange) {
    // Schedule semantics: when the admin saves a new toggle value with a
    // deadline, the new value applies for N hours, then auto-reverts to the
    // value that was effective at save time. "Permanent" / cancel_revert
    // clears the pending revert outright.
    const { data: current, error: readErr } = await supabase
      .from("landing_pages")
      .select("use_site_chrome, chrome_revert_to, chrome_revert_at")
      .eq("slug", slug)
      .maybeSingle();
    if (readErr) {
      return NextResponse.json({ error: readErr.message }, { status: 500 });
    }
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { effective: currentEffective } = effectiveChromeState(current);

    if (body.cancel_revert === true && typeof body.use_site_chrome !== "boolean") {
      updates.use_site_chrome = currentEffective;
      updates.chrome_revert_to = null;
      updates.chrome_revert_at = null;
    } else {
      const newValue = body.use_site_chrome as boolean;
      const deadlineHours = body.deadline_hours;
      if (
        deadlineHours !== null &&
        deadlineHours !== undefined &&
        !ALLOWED_DEADLINE_HOURS.has(deadlineHours)
      ) {
        return NextResponse.json(
          { error: "Invalid deadline_hours value." },
          { status: 400 }
        );
      }
      updates.use_site_chrome = newValue;
      if (deadlineHours === null || deadlineHours === undefined) {
        updates.chrome_revert_to = null;
        updates.chrome_revert_at = null;
      } else {
        updates.chrome_revert_to = currentEffective;
        updates.chrome_revert_at = new Date(
          Date.now() + deadlineHours * 60 * 60 * 1000
        ).toISOString();
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { error } = await supabase
    .from("landing_pages")
    .update(updates)
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const supabase = createSupabaseAdmin();

  // `list` is not recursive — Supabase returns folder placeholders (null
  // metadata) instead of descending. Walk the tree so subfolder files
  // (js/, css/, images/, …) don't get orphaned in the bucket.
  const pathsToRemove: string[] = [];

  async function collect(prefix: string): Promise<void> {
    const full = prefix ? `${slug}/${prefix}` : slug;
    const { data: items, error } = await supabase.storage
      .from("landing-pages")
      .list(full, { limit: 1000 });
    if (error) throw new Error(error.message);
    for (const item of items ?? []) {
      const childPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.metadata) {
        pathsToRemove.push(`${slug}/${childPath}`);
      } else {
        await collect(childPath);
      }
    }
  }

  try {
    await collect("");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "List failed" },
      { status: 500 }
    );
  }

  if (pathsToRemove.length > 0) {
    const { error: removeError } = await supabase.storage
      .from("landing-pages")
      .remove(pathsToRemove);
    if (removeError) {
      return NextResponse.json(
        { error: removeError.message },
        { status: 500 }
      );
    }
  }

  const { error: dbError } = await supabase
    .from("landing_pages")
    .delete()
    .eq("slug", slug);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
