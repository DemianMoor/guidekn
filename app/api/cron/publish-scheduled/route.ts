import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  // Vercel Cron sends a special header to verify it's a cron call
  const authHeader = request.headers.get("authorization");

  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();

  // Find scheduled articles whose publish time has arrived
  const { data: dueArticles, error: fetchError } = await supabase
    .from("articles")
    .select("id, title")
    .eq("status", "scheduled")
    .lte("published_at", now);

  if (fetchError) {
    console.error("Cron fetch error:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch scheduled articles." },
      { status: 500 }
    );
  }

  if (!dueArticles || dueArticles.length === 0) {
    return NextResponse.json({ published: 0, message: "No articles due." });
  }

  // Flip them all to published
  const ids = dueArticles.map((a) => a.id);
  const { error: updateError } = await supabase
    .from("articles")
    .update({ status: "published" })
    .in("id", ids);

  if (updateError) {
    console.error("Cron update error:", updateError);
    return NextResponse.json(
      { error: "Failed to publish scheduled articles." },
      { status: 500 }
    );
  }

  console.log(
    `Auto-published ${dueArticles.length} article(s):`,
    dueArticles.map((a) => a.title).join(", ")
  );

  return NextResponse.json({
    published: dueArticles.length,
    titles: dueArticles.map((a) => a.title),
  });
}