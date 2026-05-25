import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PILLARS } from "@/lib/brand-voice";
import PicksList from "./picks-list";
import PicksFilters from "./filters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type PicksSearchParams = {
  q?: string;
  category?: string;
  status?: string;
  pillar?: string;
  page?: string;
};

export default async function PicksAdminPage({
  searchParams,
}: {
  searchParams: Promise<PicksSearchParams>;
}) {
  const editor = await getCurrentEditor();
  if (!editor) redirect("/admin/signin");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const pillar = params.pillar?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const supabase = createSupabaseAdmin();

  // Build the filtered query with an exact count so we can paginate.
  let listQuery = supabase
    .from("picks")
    .select(
      "id, slug, category, title, dek, status, pillars, published_at, updated_at",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false });

  if (q) listQuery = listQuery.ilike("title", `%${q}%`);
  if (category) listQuery = listQuery.eq("category", category);
  if (status === "draft" || status === "published") {
    listQuery = listQuery.eq("status", status);
  }
  if (pillar && Object.keys(PILLARS).includes(pillar)) {
    listQuery = listQuery.contains("pillars", [pillar]);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: picks, error, count }, { data: categoryRows }] =
    await Promise.all([
      listQuery.range(from, to),
      supabase.from("picks").select("category"),
    ]);

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Distinct categories so the filter bar can offer them as a dropdown,
  // even when the current filtered slice doesn't include all of them.
  const allCategories = Array.from(
    new Set((categoryRows ?? []).map((r) => r.category as string))
  )
    .filter(Boolean)
    .sort();

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

      <PicksFilters categories={allCategories} />

      {error && (
        <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-4 text-sm text-ink">
          Couldn&apos;t load picks: {error.message}
        </div>
      )}

      <PicksList
        picks={picks ?? []}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
