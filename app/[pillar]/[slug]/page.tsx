import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PILLARS } from "@/lib/brand-voice";

type ArticlePageParams = {
  pillar: string;
  slug: string;
};

const VALID_PILLARS = Object.keys(PILLARS);

// Generate metadata per article — proper title, description, OG image
export async function generateMetadata({
  params,
}: {
  params: Promise<ArticlePageParams>;
}) {
  const { pillar, slug } = await params;

  if (!VALID_PILLARS.includes(pillar)) return {};

  const supabase = createSupabaseAdmin();
  const { data: article } = await supabase
    .from("articles")
    .select("title, dek, image_url, seo_title, seo_description, byline")
    .eq("slug", slug)
    .eq("pillar", pillar)
    .eq("status", "published")
    .maybeSingle();

  if (!article) return {};

  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.dek,
    openGraph: {
      title: article.title,
      description: article.dek || undefined,
      type: "article",
      authors: [article.byline],
      images: article.image_url ? [{ url: article.image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.dek || undefined,
      images: article.image_url ? [article.image_url] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<ArticlePageParams>;
}) {
  const { pillar, slug } = await params;

  if (!VALID_PILLARS.includes(pillar)) {
    notFound();
  }

  const supabase = createSupabaseAdmin();

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("pillar", pillar)
    .eq("status", "published")
    .maybeSingle();

  if (!article) {
    notFound();
  }

  const pillarData = PILLARS[pillar as keyof typeof PILLARS];

  // Find 2 related articles in the same pillar
  const { data: related } = await supabase
    .from("articles")
    .select("title, slug, dek, byline, image_url, image_alt")
    .eq("pillar", pillar)
    .eq("status", "published")
    .neq("id", article.id)
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <>
      <SiteHeader />

      <main>
        {/* Article header */}
        <article>
          <header className="bg-cream border-b border-stone">
            <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
              <Link
                href={`/${pillar}`}
                className="text-sage text-xs font-medium uppercase tracking-[0.2em] hover:text-amber"
              >
                ← {pillarData.name}
              </Link>

              <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
                {article.title}
              </h1>

              {article.dek && (
                <p className="text-ink/75 mt-6 max-w-2xl text-xl leading-relaxed md:text-2xl">
                  {article.dek}
                </p>
              )}

              <div className="text-ink/60 mt-8 flex flex-wrap items-center gap-4 text-sm">
                <span>By <strong className="text-ink">{article.byline}</strong></span>
                <span className="text-ink/30">·</span>
                <time dateTime={article.published_at || article.created_at}>
                  {new Date(article.published_at || article.created_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </time>
              </div>
            </div>
          </header>

          {/* Hero image (or placeholder) */}
          {article.image_url ? (
            <div className="bg-mist border-b border-stone">
              <div className="mx-auto max-w-5xl px-6 py-12">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image_url}
                  alt={article.image_alt || article.title}
                  className="aspect-[4/3] w-full rounded-2xl object-cover md:aspect-[16/9]"
                />
                {article.image_credit && (
                  <p className="text-ink/50 mt-3 text-xs italic">
                    {article.image_credit}
                  </p>
                )}
              </div>
            </div>
          ) : article.image_alt ? (
            <div className="bg-mist border-b border-stone">
              <div className="mx-auto max-w-5xl px-6 py-12">
                <div className="bg-cream border-stone aspect-[16/9] overflow-hidden rounded-2xl border">
                  <div className="text-ink/40 flex h-full items-center justify-center p-8 text-center text-xs italic">
                    {article.image_alt}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Body */}
          <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
            <div className="prose-editorial article-body text-ink/85 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.body}
              </ReactMarkdown>
            </div>

            {/* Sign-off */}
            <div className="border-stone mt-16 border-t pt-8">
              <p className="text-ink/60 text-sm">
                Written by <strong className="text-ink">{article.byline}</strong>{" "}
                for Guide Kin.
              </p>
            </div>
          </div>
        </article>

        {/* Related articles */}
        {related && related.length > 0 && (
          <section className="bg-mist border-y border-stone">
            <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                More in {pillarData.name}
              </p>
              <h2 className="text-ink mt-3 font-serif text-2xl font-medium tracking-tight md:text-3xl">
                What else we&apos;re writing
              </h2>

              <div className="mt-10 grid gap-10 md:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/${pillar}/${r.slug}`}
                    className="group"
                  >
                    <div className="bg-cream border-stone aspect-[4/3] overflow-hidden rounded-2xl border">
                      {r.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.image_url}
                          alt={r.image_alt || r.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-ink/40 flex h-full items-center justify-center p-6 text-center text-xs italic">
                          {r.image_alt || pillarData.name}
                        </div>
                      )}
                    </div>
                    <h3 className="text-ink group-hover:text-sage mt-4 font-serif text-lg font-medium leading-snug tracking-tight">
                      {r.title}
                    </h3>
                    {r.dek && (
                      <p className="text-ink/70 mt-2 text-sm leading-relaxed">
                        {r.dek}
                      </p>
                    )}
                    <p className="text-ink/60 mt-3 text-xs">By {r.byline}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter signup */}
        <section className="bg-sage">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <p className="text-mist text-xs font-medium uppercase tracking-[0.2em]">
              The weekly
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight text-white md:text-4xl">
              One quiet email a week, written for your kin.
            </h2>
            <p className="text-mist/90 mx-auto mt-4 max-w-xl">
              A short, useful read every Sunday morning. Something to think
              about for the week, and one thing worth your time.
            </p>
            <div className="mt-8">
              <Link
                href="/subscribe"
                className="bg-amber inline-block rounded-full px-7 py-3 text-sm text-white hover:opacity-90"
              >
                Join your kin
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}