import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

const PILLAR_NAMES: Record<string, string> = {
  body: "Body",
  mind: "Mind",
  glow: "Glow",
  roam: "Roam",
  bonds: "Bonds",
  years: "Years",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-stone/40 text-ink/70",
  scheduled: "bg-amber/20 text-amber",
  published: "bg-mist text-sage",
  archived: "bg-stone text-ink/60",
};

export default async function ArticlesPage() {
  const editor = await getCurrentEditor();
  if (!editor) {
    redirect("/admin/signin");
  }

  const supabase = createSupabaseAdmin();
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, pillar, status, byline, updated_at, published_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
            Articles
          </p>
          <h1 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
            Articles
          </h1>
          <p className="text-ink/70 mt-2 text-sm">
            Drafts, scheduled posts, and everything published.
          </p>
        </div>

        <Link
          href="/admin/articles/new"
          className="bg-sage mt-2 rounded-full px-5 py-2.5 text-sm text-white hover:opacity-90 whitespace-nowrap"
        >
          + New article
        </Link>
      </div>

      {error && (
        <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-4 text-sm text-ink">
          Couldn&apos;t load articles: {error.message}
        </div>
      )}

      {articles && articles.length === 0 && (
        <div className="bg-white border-stone mt-8 rounded-2xl border p-12 text-center">
          <p className="text-ink/70">
            No articles yet. Click <strong>New article</strong> to draft your
            first piece.
          </p>
        </div>
      )}

      {articles && articles.length > 0 && (
        <div className="bg-white border-stone mt-8 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-mist border-stone border-b">
              <tr className="text-ink/70 text-left">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Pillar</th>
                <th className="px-4 py-3 font-medium">Byline</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr
                  key={a.id}
                  className="border-stone hover:bg-cream border-b last:border-0 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="text-ink hover:text-sage block font-medium"
                    >
                      {a.title}
                    </Link>
                  </td>
                  <td className="text-ink/80 px-4 py-3 text-xs">
                    {PILLAR_NAMES[a.pillar] || a.pillar}
                  </td>
                  <td className="text-ink/70 px-4 py-3 text-xs">{a.byline}</td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 capitalize ${
                        STATUS_STYLES[a.status] || "bg-stone text-ink/60"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="text-ink/60 px-4 py-3 text-xs">
                    {new Date(a.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}