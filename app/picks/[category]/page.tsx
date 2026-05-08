export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PickHeroCard } from "@/components/picks/pick-hero-card";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,80}$/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const display = category.replace(/-/g, " ");
  return {
    title: `${display} picks — Guide Kin`,
    description: `Editorial round-ups in ${display}, tested for adults 35 and up.`,
  };
}

export default async function PickCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!SLUG_REGEX.test(category)) {
    notFound();
  }

  const supabase = createSupabaseAdmin();
  const { data: picks } = await supabase
    .from("picks")
    .select(
      "id, slug, category, title, dek, hero_image_url, hero_image_alt, byline, pillars, published_at"
    )
    .eq("category", category)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!picks || picks.length === 0) {
    notFound();
  }

  const display = category.replace(/-/g, " ");

  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-28">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              Picks &middot;{" "}
              <span className="capitalize">{display}</span>
            </p>
            <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl capitalize">
              The {display} we&apos;d actually buy.
            </h1>
          </div>
        </section>

        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {picks.map((p) => (
                <PickHeroCard key={p.id} pick={p} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
