import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import FileManager from "./file-manager";

export const dynamic = "force-dynamic";

export default async function LandingPageEdit({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const editor = await getCurrentEditor();
  if (!editor) redirect("/admin/signin");

  const { slug } = await params;
  const supabase = createSupabaseAdmin();
  const { data: page } = await supabase
    .from("landing_pages")
    .select("slug, title, description, entry_file, is_active, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!page) notFound();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href="/admin/landing-pages"
          className="text-ink/60 hover:text-sage text-xs uppercase tracking-[0.2em]"
        >
          ← Landing pages
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-1">{page.title}</h1>
          <p className="text-ink/60 font-mono text-xs">/lp/{page.slug}</p>
          {page.description && (
            <p className="text-ink/70 mt-2 text-sm">{page.description}</p>
          )}
        </div>
        <a
          href={`/lp/${page.slug}`}
          target="_blank"
          rel="noreferrer"
          className="bg-sage text-cream px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 whitespace-nowrap"
        >
          View page ↗
        </a>
      </div>

      <FileManager slug={page.slug} entryFile={page.entry_file} />
    </div>
  );
}
