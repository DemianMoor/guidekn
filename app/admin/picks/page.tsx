import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PILLARS } from "@/lib/brand-voice";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-stone/40 text-ink/70",
  published: "bg-mist text-sage",
};

export default async function PicksAdminPage() {
  const editor = await getCurrentEditor();
  if (!editor) redirect("/admin/signin");

  const supabase = createSupabaseAdmin();
  const { data: picks, error } = await supabase
    .from("picks")
    .select(
      "id, slug, category, title, dek, status, pillars, published_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
            Picks
          </p>
          <h1 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
            Picks
          </h1>
          <p className="text-ink/70 mt-2 text-sm">
            Round-up product reviews. Each pick lives at /picks/&lt;category&gt;/&lt;slug&gt;.
          </p>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/admin/picks/import"
            className="text-ink hover:border-sage hover:text-sage rounded-full border border-stone px-4 py-2.5 text-sm whitespace-nowrap"
          >
            Bulk import
          </Link>
          <Link
            href="/admin/picks/new"
            className="bg-sage rounded-full px-5 py-2.5 text-sm text-white hover:opacity-90 whitespace-nowrap"
          >
            + New pick
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-4 text-sm text-ink">
          Couldn&apos;t load picks: {error.message}
        </div>
      )}

      {picks && picks.length === 0 && (
        <div className="bg-white border-stone mt-8 rounded-2xl border p-12 text-center">
          <p className="text-ink/70">
            No picks yet. Click <strong>New pick</strong> to draft your first
            round-up.
          </p>
        </div>
      )}

      {picks && picks.length > 0 && (
        <div className="bg-white border-stone mt-8 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-mist border-stone border-b">
              <tr className="text-ink/70 text-left">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Pillars</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {picks.map((p) => (
                <tr
                  key={p.id}
                  className="border-stone hover:bg-cream border-b last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/picks/${p.id}/edit`}
                      className="text-ink hover:text-sage block font-medium"
                    >
                      {p.title}
                    </Link>
                    {p.dek && (
                      <p className="text-ink/60 mt-1 text-xs line-clamp-1">
                        {p.dek}
                      </p>
                    )}
                  </td>
                  <td className="text-ink/80 px-4 py-3 text-xs capitalize">
                    {p.category.replace(/-/g, " ")}
                  </td>
                  <td className="text-ink/70 px-4 py-3 text-xs">
                    {(p.pillars ?? [])
                      .map(
                        (s: string) =>
                          PILLARS[s as keyof typeof PILLARS]?.name ?? s
                      )
                      .join(", ") || (
                      <span className="text-ink/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 capitalize ${
                        STATUS_STYLES[p.status] || "bg-stone text-ink/60"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="text-ink/60 px-4 py-3 text-xs">
                    {new Date(p.updated_at).toLocaleDateString()}
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
