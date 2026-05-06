export const dynamic = "force-dynamic";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleImage } from "@/components/article-image";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PILLARS } from "@/lib/brand-voice";

const pillars = [
  { slug: "body", name: "Body", blurb: "Strength, sleep, and moving for the long road." },
  { slug: "mind", name: "Mind", blurb: "Focus, calm, and what we actually pay attention to." },
  { slug: "glow", name: "Glow", blurb: "Skin, style, and showing up like yourself." },
  { slug: "roam", name: "Roam", blurb: "Trips, weekends, and going somewhere on purpose." },
  { slug: "bonds", name: "Bonds", blurb: "Friendships, family, and the people who know you." },
  { slug: "years", name: "Years", blurb: "Money, work, and what's next — without the noise." },
];

export default async function Home() {
  const supabase = createSupabaseAdmin();

  // Fetch settings + articles in parallel
  const [settingsRes, articlesRes] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase
      .from("articles")
      .select("title, slug, pillar, dek, byline, image_url, image_alt, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(4),
  ]);

  const settings: Record<string, string> = {};
  if (settingsRes.data) {
    for (const row of settingsRes.data) {
      if (row.value) settings[row.key] = row.value;
    }
  }

  const articles = articlesRes.data;
  const featured = articles?.[0] || null;
  const rest = articles?.slice(1, 4) || [];
  const hasArticles = articles && articles.length > 0;

  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-stone">
          {settings.homepage_hero_image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.homepage_hero_image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-cream/70 backdrop-blur-[2px]" />
            </>
          ) : (
            <div className="absolute inset-0 bg-cream" />
          )}
          <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              A community for adults 35 and up
            </p>
            <h1 className="text-ink mt-6 font-serif text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
              Guidance from people who get it.
            </h1>
            <p className="text-ink/75 mx-auto mt-8 max-w-2xl text-lg leading-relaxed">
              Honest writing on what actually matters at this stage — sourced,
              plainspoken, and from people who&apos;ve been there.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/subscribe"
                className="bg-sage rounded-full px-7 py-3 text-sm text-white hover:opacity-90"
              >
                Join your kin
              </Link>
              <Link
                href="/about"
                className="text-ink hover:border-sage hover:text-sage rounded-full border border-stone px-7 py-3 text-sm"
              >
                What we&apos;re about
              </Link>
            </div>
          </div>
        </section>

        {/* Six pillars */}
        <section className="bg-mist border-b border-stone">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              Six pillars
            </p>
            <h2 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
              What we cover, and why.
            </h2>
            <p className="text-ink/70 mt-4 max-w-2xl">
              We write about the six things that quietly shape every chapter
              after 35. No lectures, no hacks — just useful writing from
              people who&apos;ve been there.
            </p>

            <div className="mt-12 grid gap-px bg-stone/60 overflow-hidden rounded-2xl border border-stone md:grid-cols-2 lg:grid-cols-3">
              {pillars.map((p) => (
                <Link
                  key={p.slug}
                  href={`/${p.slug}`}
                  className="group bg-cream hover:bg-white p-8 transition"
                >
                  <h3 className="text-sage text-xl font-medium">{p.name}</h3>
                  <p className="text-ink/75 mt-2 text-sm">{p.blurb}</p>
                  <span className="text-amber group-hover:text-sage mt-6 inline-block text-sm">
                    Read more →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* This week */}
        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                  This week
                </p>
                <h2 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
                  What we&apos;re reading
                </h2>
              </div>
            </div>

            {!hasArticles && (
              <div className="bg-white border-stone mt-10 rounded-2xl border p-12 text-center">
                <p className="text-ink/70">
                  We&apos;re putting the first pieces together. Join the list
                  and we&apos;ll send them when they&apos;re ready.
                </p>
                <div className="mt-6">
                  <Link
                    href="/subscribe"
                    className="bg-sage inline-block rounded-full px-6 py-2 text-sm text-white hover:opacity-90"
                  >
                    Join your kin
                  </Link>
                </div>
              </div>
            )}

            {/* Featured */}
            {featured && (
              <Link
                href={`/${featured.pillar}/${featured.slug}`}
                className="group mt-10 grid gap-8 border-b border-stone pb-12 md:grid-cols-2"
              >
                <ArticleImage article={featured} aspectClass="aspect-[4/3]" />
                <div className="flex flex-col justify-center">
                  <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                    {PILLARS[featured.pillar as keyof typeof PILLARS]?.name}
                  </p>
                  <h3 className="text-ink group-hover:text-sage mt-3 font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl">
                    {featured.title}
                  </h3>
                  {featured.dek && (
                    <p className="text-ink/75 mt-4 leading-relaxed">{featured.dek}</p>
                  )}
                  <p className="text-ink/60 mt-6 text-sm">By {featured.byline}</p>
                </div>
              </Link>
            )}

            {/* Article grid */}
            {rest.length > 0 && (
              <div className="mt-12 grid gap-10 md:grid-cols-3">
                {rest.map((a) => (
                  <Link key={a.slug} href={`/${a.pillar}/${a.slug}`} className="group">
                    <ArticleImage article={a} aspectClass="aspect-[4/3]" />
                    <p className="text-sage mt-4 text-xs font-medium uppercase tracking-[0.2em]">
                      {PILLARS[a.pillar as keyof typeof PILLARS]?.name}
                    </p>
                    <h3 className="text-ink group-hover:text-sage mt-2 font-serif text-xl font-medium leading-snug tracking-tight">
                      {a.title}
                    </h3>
                    {a.dek && (
                      <p className="text-ink/70 mt-2 text-sm leading-relaxed">
                        {a.dek}
                      </p>
                    )}
                    <p className="text-ink/60 mt-3 text-xs">By {a.byline}</p>
                  </Link>
                ))}
              </div>
            )}
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