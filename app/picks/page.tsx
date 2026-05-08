export const dynamic = "force-dynamic";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PickHeroCard } from "@/components/picks/pick-hero-card";

export const metadata = {
  title: "Picks — Guide Kin",
  description:
    "Editorial product round-ups for adults 35+. Tested, sourced, no fluff.",
};

export default async function PicksHomePage() {
  const supabase = createSupabaseAdmin();

  const { data: picks } = await supabase
    .from("picks")
    .select(
      "id, slug, category, title, dek, hero_image_url, hero_image_alt, byline, pillars, published_at"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(12);

  const { data: categoryRows } = await supabase
    .from("picks")
    .select("category")
    .eq("status", "published");
  const categories = Array.from(
    new Set((categoryRows ?? []).map((r) => r.category))
  ).sort();

  const featured = picks?.[0] ?? null;
  const rest = picks?.slice(1) ?? [];

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-28">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              Picks
            </p>
            <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-6xl">
              Things we&apos;ve actually tested.
            </h1>
            <p className="text-ink/75 mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
              Round-ups for adults 35 and up — sourced, tested, opinionated.
              We tell you what we&apos;d buy and why, then get out of your way.
            </p>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="bg-mist border-b border-stone">
            <div className="mx-auto max-w-6xl px-6 py-10">
              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em] mb-4">
                Browse by category
              </p>
              <div className="flex flex-wrap gap-3">
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={`/picks/${c}`}
                    className="text-ink hover:bg-sage hover:border-sage rounded-full border border-stone bg-white px-5 py-2 text-sm hover:text-white capitalize"
                  >
                    {c.replace(/-/g, " ")}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent picks */}
        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            {!picks || picks.length === 0 ? (
              <div className="bg-white border-stone rounded-2xl border p-12 text-center">
                <p className="text-ink/70">
                  We&apos;re putting the first round-ups together.
                </p>
              </div>
            ) : (
              <>
                {featured && <PickHeroCard pick={featured} featured />}
                {rest.length > 0 && (
                  <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3 border-t border-stone pt-12">
                    {rest.map((p) => (
                      <PickHeroCard key={p.id} pick={p} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
