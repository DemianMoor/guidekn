export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PILLARS, type PillarSlug } from "@/lib/brand-voice";

const allPillars = Object.keys(PILLARS) as PillarSlug[];

// Pillar landing copy (homepage-style intro per pillar)
const pillarIntros: Record<PillarSlug, { headline: string; intro: string }> = {
  body: {
    headline: "Strength, sleep, and moving for the long road.",
    intro:
      "What the research actually says about staying strong, mobile, and energetic — at every stage. Strength training in your 50s, sleep that works in your 60s, the supplements worth talking to your doctor about and the ones that aren't.",
  },
  mind: {
    headline: "Clarity, focus, and peace of mind.",
    intro:
      "Cognitive health, focus, stress, the quiet kind of mental health that doesn't get talked about enough. Practical writing on what helps and what doesn't, sourced and specific.",
  },
  glow: {
    headline: "Looking like yourself, only better.",
    intro:
      "Skincare, style, and presentation — playful, confident, never aspirational-shaming. The point isn't to look younger. The point is to look like yourself, on a good day.",
  },
  roam: {
    headline: "Travel that earns the trip.",
    intro:
      "Vivid, sensory, practical writing on travel that's worth the time off. Where to go, when, what to actually do when you get there.",
  },
  bonds: {
    headline: "The relationships that matter.",
    intro:
      "Honest, tender, non-judgmental writing on partners, friendships, family, and the relationships you build at this stage of life.",
  },
  years: {
    headline: "Living well, longer.",
    intro:
      "Matter-of-fact, optimistic writing about getting older — money, purpose, planning, and the things nobody told you to think about until now.",
  },
};


export async function generateMetadata({
  params,
}: {
  params: Promise<{ pillar: string }>;
}) {
  const { pillar } = await params;
  if (!(pillar in PILLARS)) return {};
  const data = pillarIntros[pillar as PillarSlug];
  return {
    title: PILLARS[pillar as PillarSlug].name,
    description: data.headline,
  };
}

export default async function PillarPage({
  params,
}: {
  params: Promise<{ pillar: string }>;
}) {
  const { pillar } = await params;

  if (!(pillar in PILLARS)) {
    notFound();
  }

  const pillarSlug = pillar as PillarSlug;
  const data = pillarIntros[pillarSlug];
  const otherPillars = allPillars.filter((p) => p !== pillarSlug);

  // Fetch published articles for this pillar
  const supabase = createSupabaseAdmin();
  const { data: articles } = await supabase
    .from("articles")
    .select("title, slug, dek, byline, image_url, image_alt, published_at")
    .eq("pillar", pillar)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const hasArticles = articles && articles.length > 0;
  const featured = articles?.[0] || null;
  const rest = articles?.slice(1) || [];

  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              {PILLARS[pillarSlug].name}
            </p>
            <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-6xl">
              {data.headline}
            </h1>
            <p className="text-ink/75 mx-auto mt-8 max-w-2xl text-lg leading-relaxed">
              {data.intro}
            </p>
          </div>
        </section>

        {/* Articles or empty state */}
        {hasArticles ? (
          <section className="bg-cream border-b border-stone">
            <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
              {/* Featured */}
              {featured && (
                <Link
                  href={`/${pillar}/${featured.slug}`}
                  className="group grid gap-8 border-b border-stone pb-16 md:grid-cols-2 md:gap-12"
                >
                  <div className="bg-mist border-stone aspect-[4/3] overflow-hidden rounded-2xl border">
                    {featured.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured.image_url}
                        alt={featured.image_alt || featured.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-ink/40 flex h-full items-center justify-center p-8 text-center text-xs italic">
                        {featured.image_alt || PILLARS[pillarSlug].name}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-amber text-xs font-medium uppercase tracking-[0.2em]">
                      Featured
                    </p>
                    <h2 className="text-ink group-hover:text-sage mt-3 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                      {featured.title}
                    </h2>
                    {featured.dek && (
                      <p className="text-ink/75 mt-4 leading-relaxed">{featured.dek}</p>
                    )}
                    <p className="text-ink/60 mt-6 text-sm">By {featured.byline}</p>
                    <span className="text-amber group-hover:text-sage mt-6 inline-block text-sm">
                      Read the piece →
                    </span>
                  </div>
                </Link>
              )}

              {/* Article grid */}
              {rest.length > 0 && (
                <div className="mt-16 grid gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-3">
                  {rest.map((a) => (
                    <Link key={a.slug} href={`/${pillar}/${a.slug}`} className="group">
                      <div className="bg-mist border-stone aspect-[4/3] overflow-hidden rounded-2xl border">
                        {a.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.image_url}
                            alt={a.image_alt || a.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-ink/40 flex h-full items-center justify-center p-6 text-center text-xs italic">
                            {a.image_alt || PILLARS[pillarSlug].name}
                          </div>
                        )}
                      </div>
                      <p className="text-sage mt-4 text-xs font-medium uppercase tracking-[0.2em]">
                        {PILLARS[pillarSlug].name}
                      </p>
                      <h3 className="text-ink group-hover:text-sage mt-2 font-serif text-xl font-medium leading-snug tracking-tight">
                        {a.title}
                      </h3>
                      {a.dek && (
                        <p className="text-ink/70 mt-2 text-sm leading-relaxed">{a.dek}</p>
                      )}
                      <p className="text-ink/60 mt-3 text-xs">By {a.byline}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          /* Empty state */
          <section className="bg-mist border-b border-stone">
            <div className="mx-auto max-w-2xl px-6 py-20 md:py-28">
              <div className="bg-cream border-stone rounded-2xl border p-10 text-center md:p-14">
                <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                  Coming soon
                </p>
                <h2 className="text-ink mt-4 font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl">
                  We&apos;re still writing the first pieces for{" "}
                  {PILLARS[pillarSlug].name}.
                </h2>
                <p className="text-ink/75 mt-4 leading-relaxed">
                  Join your kin and we&apos;ll send them when they&apos;re
                  ready. One quiet email, no spam, unsubscribe in one tap.
                </p>
                <div className="mt-8">
                  <Link
                    href="/subscribe"
                    className="bg-sage inline-block rounded-full px-6 py-3 text-sm text-white hover:opacity-90"
                  >
                    Join the list
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Other pillars */}
        <section className="bg-mist border-b border-stone">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              Also on Guide Kin
            </p>
            <h3 className="text-ink mt-3 font-serif text-2xl font-medium tracking-tight md:text-3xl">
              Five other things we write about
            </h3>
            <div className="mt-8 flex flex-wrap gap-3">
              {otherPillars.map((p) => (
                <Link
                  key={p}
                  href={`/${p}`}
                  className="text-ink hover:bg-sage hover:border-sage rounded-full border border-stone bg-white px-5 py-2 text-sm hover:text-white"
                >
                  {PILLARS[p].name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
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
            <p className="mt-8">
              <Link
                href="/subscribe"
                className="bg-amber inline-block rounded-full px-6 py-3 text-sm text-white hover:opacity-90"
              >
                Join the list
              </Link>
            </p>
            <p className="text-mist/70 mt-4 text-xs">
              Free, always. Unsubscribe in one tap.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}