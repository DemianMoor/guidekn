export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PILLARS } from "@/lib/brand-voice";
import { ProductCard } from "@/components/picks/product-card";
import { PickHeroCard } from "@/components/picks/pick-hero-card";
import type { PickProduct } from "@/lib/picks-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const supabase = createSupabaseAdmin();
  const { data: pick } = await supabase
    .from("picks")
    .select("title, dek, hero_image_url, seo_title, seo_description, byline")
    .eq("category", category)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!pick) return {};

  return {
    title: pick.seo_title || pick.title,
    description: pick.seo_description || pick.dek,
    openGraph: {
      title: pick.title,
      description: pick.dek || undefined,
      type: "article",
      authors: [pick.byline],
      images: pick.hero_image_url ? [{ url: pick.hero_image_url }] : undefined,
    },
  };
}

export default async function PickPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const supabase = createSupabaseAdmin();

  const { data: pick } = await supabase
    .from("picks")
    .select("*")
    .eq("category", category)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!pick) notFound();

  const { data: products } = await supabase
    .from("pick_products")
    .select("*")
    .eq("pick_id", pick.id)
    .order("position", { ascending: true });

  const categoryDisplay = pick.category.replace(/-/g, " ");

  return (
    <>
      <SiteHeader />
      <main>
        {/* Header */}
        <header className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
            <Link
              href={`/picks/${pick.category}`}
              className="text-sage text-xs font-medium uppercase tracking-[0.2em] hover:text-amber"
            >
              ← Picks &middot;{" "}
              <span className="capitalize">{categoryDisplay}</span>
            </Link>
            <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
              {pick.title}
            </h1>
            {pick.dek && (
              <p className="text-ink/75 mt-6 max-w-2xl text-xl leading-relaxed md:text-2xl">
                {pick.dek}
              </p>
            )}
            <div className="text-ink/60 mt-8 flex flex-wrap items-center gap-4 text-sm">
              <span>
                By <strong className="text-ink">{pick.byline}</strong>
              </span>
              {pick.published_at && (
                <>
                  <span className="text-ink/30">&middot;</span>
                  <time dateTime={pick.published_at}>
                    {new Date(pick.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero image */}
        {pick.hero_image_url && (
          <div className="bg-mist border-b border-stone">
            <div className="mx-auto max-w-5xl px-6 py-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pick.hero_image_url}
                alt={pick.hero_image_alt || pick.title}
                className="aspect-[4/3] w-full rounded-2xl object-cover md:aspect-[16/9]"
              />
            </div>
          </div>
        )}

        {/* Intro */}
        {pick.intro && (
          <section className="mx-auto max-w-3xl px-6 py-12 md:py-16">
            <div className="prose-editorial article-body text-ink/85 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {pick.intro}
              </ReactMarkdown>
            </div>
          </section>
        )}

        {/* Methodology callout */}
        {pick.methodology && (
          <section className="bg-mist border-y border-stone">
            <div className="mx-auto max-w-3xl px-6 py-10">
              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em] mb-3">
                How we tested
              </p>
              <div className="prose-editorial text-ink/85 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {pick.methodology}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        )}

        {/* Products */}
        {products && products.length > 0 && (
          <section className="bg-cream">
            <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
              <div className="grid gap-8 md:grid-cols-2 md:gap-10">
                {products.map((p, idx) => (
                  <ProductCard
                    key={p.id}
                    product={p as PickProduct}
                    index={idx + 1}
                    pickSlug={pick.slug}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Related picks (same category, exclude this one) */}
        <RelatedPicks category={pick.category} excludeId={pick.id} />

        {/* Pillar links */}
        {pick.pillars && pick.pillars.length > 0 && (
          <section className="bg-mist border-y border-stone">
            <div className="mx-auto max-w-4xl px-6 py-12">
              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em] mb-3">
                Related reading
              </p>
              <p className="text-ink/80 mb-4">
                This piece touches on{" "}
                {pick.pillars.length === 1 ? "this pillar" : "these pillars"}{" "}
                of Guide Kin:
              </p>
              <div className="flex flex-wrap gap-3">
                {pick.pillars.map((p: string) => {
                  const pillarMeta = PILLARS[p as keyof typeof PILLARS];
                  if (!pillarMeta) return null;
                  return (
                    <Link
                      key={p}
                      href={`/${p}`}
                      className="text-ink hover:bg-sage hover:border-sage rounded-full border border-stone bg-white px-5 py-2 text-sm hover:text-white"
                    >
                      {pillarMeta.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter */}
        <section className="bg-sage">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <p className="text-mist text-xs font-medium uppercase tracking-[0.2em]">
              The weekly
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight text-white md:text-4xl">
              One quiet email a week, written for your kin.
            </h2>
            <Link
              href="/subscribe"
              className="bg-amber mt-8 inline-block rounded-full px-7 py-3 text-sm text-white hover:opacity-90"
            >
              Join your kin
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

async function RelatedPicks({
  category,
  excludeId,
}: {
  category: string;
  excludeId: string;
}) {
  const supabase = createSupabaseAdmin();
  const { data: related } = await supabase
    .from("picks")
    .select(
      "id, slug, category, title, dek, hero_image_url, hero_image_alt, byline, pillars, published_at"
    )
    .eq("category", category)
    .eq("status", "published")
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(3);

  if (!related || related.length === 0) return null;

  return (
    <section className="bg-cream border-t border-stone">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
          More in {category.replace(/-/g, " ")}
        </p>
        <h2 className="text-ink mt-3 font-serif text-2xl font-medium tracking-tight md:text-3xl">
          What else we&apos;ve tested
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {related.map((p) => (
            <PickHeroCard key={p.id} pick={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
