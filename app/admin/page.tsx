import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

export default async function AdminDashboard() {
  const editor = await getCurrentEditor();

  if (!editor) {
    redirect("/admin/signin");
  }

  // Quick stats
  const supabase = createSupabaseAdmin();

  const [draftsResult, publishedResult, subscribersResult] = await Promise.all([
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  return (
    <div>
      <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
        Dashboard
      </p>
      <h1 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        Welcome back, {editor.display_name.split(" ")[0]}.
      </h1>

      {/* Stats */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="bg-white border-stone rounded-2xl border p-6">
          <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
            Drafts
          </p>
          <p className="text-ink mt-2 font-serif text-3xl font-medium">
            {draftsResult.count ?? 0}
          </p>
        </div>
        <div className="bg-white border-stone rounded-2xl border p-6">
          <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
            Published
          </p>
          <p className="text-ink mt-2 font-serif text-3xl font-medium">
            {publishedResult.count ?? 0}
          </p>
        </div>
        <div className="bg-white border-stone rounded-2xl border p-6">
          <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
            Active subscribers
          </p>
          <p className="text-ink mt-2 font-serif text-3xl font-medium">
            {subscribersResult.count ?? 0}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white border-stone mt-8 rounded-2xl border p-8">
        <h2 className="text-ink font-serif text-xl font-medium tracking-tight">
          Quick start
        </h2>
        <p className="text-ink/70 mt-2 text-sm">
          The article editor is coming next session. For now, you can browse
          the existing site and confirm everything looks right.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="bg-sage rounded-full px-5 py-2 text-sm text-white hover:opacity-90"
          >
            View site ↗
          </Link>
          <Link
            href="/admin/subscribers"
            className="text-ink hover:border-sage hover:text-sage rounded-full border border-stone px-5 py-2 text-sm"
          >
            See subscribers
          </Link>
        </div>
      </div>
    </div>
  );
}