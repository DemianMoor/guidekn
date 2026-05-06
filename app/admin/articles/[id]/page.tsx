import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

export default async function ArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const editor = await getCurrentEditor();
  if (!editor) {
    redirect("/admin/signin");
  }

  const supabase = createSupabaseAdmin();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !article) {
    notFound();
  }

  return (
    <div>
      <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
        Articles / Draft
      </p>
      <h1 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        {article.title}
      </h1>
      <p className="text-ink/70 mt-2 text-sm">
        {PILLAR_NAMES[article.pillar]} · By {article.byline} · Status:{" "}
        <span className="capitalize">{article.status}</span>
      </p>

      {/* Placeholder for the full editor — built in Session C Part 2 */}
      <div className="bg-white border-stone mt-8 rounded-2xl border p-8">
        <p className="text-amber bg-mist border-stone rounded-xl border p-4 text-sm">
          <strong>Generated draft saved.</strong> The full article editor is
          coming in the next session — for now you can preview the AI&apos;s
          output below.
        </p>

        <div className="mt-8">
          <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
            Dek
          </p>
          <p className="text-ink mt-2 italic">{article.dek}</p>
        </div>

        <div className="mt-8">
          <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
            Body
          </p>
          <div className="prose-editorial text-ink/85 mt-4 whitespace-pre-wrap leading-relaxed">
            {article.body}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
            Image suggestion
          </p>
          <p className="text-ink/80 mt-2 text-sm italic">{article.image_alt}</p>
        </div>

        <div className="border-stone mt-10 flex gap-3 border-t pt-6">
          <Link
            href="/admin/articles"
            className="text-ink hover:border-sage hover:text-sage rounded-full border border-stone px-5 py-2 text-sm"
          >
            Back to articles
          </Link>
          <Link
            href="/admin/articles/new"
            className="bg-sage rounded-full px-5 py-2 text-sm text-white hover:opacity-90"
          >
            Generate another draft
          </Link>
        </div>
      </div>
    </div>
  );
}