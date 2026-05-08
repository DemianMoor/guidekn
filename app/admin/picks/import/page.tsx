import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import ImportForm from "./import-form";

export const dynamic = "force-dynamic";

export default async function PicksImportPage() {
  const editor = await getCurrentEditor();
  if (!editor) redirect("/admin/signin");

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
        Picks / Import
      </p>
      <h1 className="text-3xl font-serif text-ink mt-3 mb-2">
        Bulk import picks
      </h1>
      <p className="text-ink/70 mb-6 text-sm leading-relaxed">
        One CSV file, one row per product. Pick-level fields (category, slug,
        title, intro, etc.) repeat on each row of the same round-up — the
        importer groups by <code className="text-ink/80">pick_category</code> +{" "}
        <code className="text-ink/80">pick_slug</code> and creates the pick
        from the first matching row. Picks at slugs that already exist are
        skipped.
      </p>

      <div className="bg-mist border border-stone rounded-lg p-4 text-sm space-y-2">
        <p className="text-ink font-medium">Cell formats</p>
        <ul className="text-ink/75 list-disc pl-5 space-y-1 text-xs leading-relaxed">
          <li>
            <code className="text-ink/85">pick_pillars</code>: pipe-separated
            slugs, e.g. <code>body|years</code>. Valid: body, mind, glow, roam,
            bonds, years.
          </li>
          <li>
            <code className="text-ink/85">pros</code> and{" "}
            <code className="text-ink/85">cons</code>: pipe-separated, e.g.{" "}
            <code>Quiet|Long battery|Travels well</code>.
          </li>
          <li>
            <code className="text-ink/85">specs</code>: pipe-separated{" "}
            <code>key=value</code>, e.g.{" "}
            <code>Weight=1.2 kg|Battery=5 hours</code>.
          </li>
          <li>
            <code className="text-ink/85">pick_status</code>:{" "}
            <code>draft</code> or <code>published</code>. Empty defaults to
            draft.
          </li>
          <li>
            <code className="text-ink/85">pick_published_at</code>: ISO 8601
            (e.g. <code>2026-05-08T08:00:00Z</code>). Empty + published status
            uses the current time.
          </li>
        </ul>
      </div>

      <ImportForm />
    </div>
  );
}
