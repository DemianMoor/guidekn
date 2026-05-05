import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type Article = {
  slug: string;
  title: string;
  dek: string;
  byline: string;
  imageAlt: string;
  featured?: boolean;
};

type PillarContent = {
  name: string;
  headline: string;
  intro: string;
  articles: Article[];
};

const pillarData: Record<string, PillarContent> = {
  body: {
    name: "Body",
    headline: "Strength, sleep, and moving for the long road.",
    intro:
      "What the research actually says about staying strong, mobile, and energetic — at every stage. Strength training in your 50s, sleep that works in your 60s, the supplements worth talking to your doctor about and the ones that aren't.",
    articles: [
      {
        slug: "hips-not-knees",
        featured: true,
        title: "Why your hips, not your knees, decide how you'll move at 70",
        dek: "The orthopedic research no one talks about: hip mobility quietly governs almost every movement that matters later. Here's what the evidence says, and the simple work that actually pays off.",
        byline: "Dr. Elena Park",
        imageAlt:
          "Person in their fifties doing a deep hip-opening stretch on a wooden floor, sunlit room",
      },
      {
        slug: "strength-training-for-gym-haters",
        title: "The strength training program for people who hate gyms",
        dek: "Three days a week, no commute, nothing fancy. The plan a sports physiologist would actually recommend if you asked him over coffee.",
        byline: "Theo Williams",
        imageAlt: "Two adjustable dumbbells on a hardwood floor next to running shoes",
      },
      {
        slug: "sleep-after-45",
        title: "Sleep after 45: what changes, and what helps",
        dek: "Why your sleep architecture shifts in midlife, what's normal, and the small adjustments that move the needle without medication.",
        byline: "Maya Okafor",
        imageAlt: "Linen bedsheets in soft morning light, an open paperback face-down",
      },
      {
        slug: "supplements-worth-it",
        title: "On supplements: the four worth the money, and the rest",
        dek: "We read the studies so you don't have to. A short, plainspoken guide to what your doctor would probably tell you in a longer appointment.",
        byline: "Dr. Elena Park",
        imageAlt: "Small wooden bowl holding capsules and tablets on a kitchen counter",
      },
      {
        slug: "walking-is-underrated",
        title: "Walking is underrated. Here's the case.",
        dek: "The most quietly powerful thing you can do for your body is also the cheapest, simplest, and easiest to keep doing for thirty more years.",
        byline: "Theo Williams",
        imageAlt: "Person walking on a tree-lined path at golden hour, mid-stride",
      },
      {
        slug: "mobility-eight-minutes",
        title: "Mobility work that takes 8 minutes a day",
        dek: "A short routine built around the joints that age fastest. Designed to be done in your kitchen, in socks, before the kettle boils.",
        byline: "Ines Marchetti",
        imageAlt: "Bare feet on a yoga mat in a sunlit kitchen with a kettle on the stove",
      },
    ],
  },
  mind: {
    name: "Mind",
    headline: "Clarity, focus, and peace of mind.",
    intro:
      "Cognitive health, focus, stress, the quiet kind of mental health that doesn't get talked about enough. Practical writing on what helps and what doesn't, sourced and specific.",
    articles: [],
  },
  glow: {
    name: "Glow",
    headline: "Looking like yourself, only better.",
    intro:
      "Skincare, style, and presentation — playful, confident, never aspirational-shaming. The point isn't to look younger. The point is to look like yourself, on a good day.",
    articles: [],
  },
  roam: {
    name: "Roam",
    headline: "Travel that earns the trip.",
    intro:
      "Vivid, sensory, practical writing on travel that's worth the time off. Where to go, when, what to actually do when you get there.",
    articles: [],
  },
  bonds: {
    name: "Bonds",
    headline: "The relationships that matter.",
    intro:
      "Honest, tender, non-judgmental writing on partners, friendships, family, and the relationships you build at this stage of life.",
    articles: [],
  },
  years: {
    name: "Years",
    headline: "Living well, longer.",
    intro:
      "Matter-of-fact, optimistic writing about getting older — money, purpose, planning, and the things nobody told you to think about until now.",
    articles: [],
  },
};

const allPillars = Object.keys(pillarData);

export function generateStaticParams() {
  return allPillars.map((pillar) => ({ pillar }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pillar: string }>;
}) {
  const { pillar } = await params;
  if (!(pillar in pillarData)) return {};
  const data = pillarData[pillar];
  return {
    title: `${data.name} — Guide Kin`,
    description: data.headline,
  };
}

export default async function PillarPage({
  params,
}: {
  params: Promise<{ pillar: string }>;
}) {
  const { pillar } = await params;

  if (!(pillar in pillarData)) {
    notFound();
  }

  const data = pillarData[pillar];
  const featured = data.articles.find((a) => a.featured);
  const rest = data.articles.filter((a) => !a.featured);
  const otherPillars = allPillars.filter((p) => p !== pillar);

  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              {data.name}
            </p>
            <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-6xl">
              {data.headline}
            </h1>
            <p className="text-ink/75 mx-auto mt-8 max-w-2xl text-lg leading-relaxed">
              {data.intro}
            </p>
          </div>
        </section>

        {/* Articles or Empty State */}
        {data.articles.length > 0 ? (
          <section className="bg-cream border-b border-stone">
            <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
              {/* Featured */}
              {featured && (
                <Link
                  href="#"
                  className="group grid gap-8 border-b border-stone pb-16 md:grid-cols-2 md:gap-12"
                >
                  <div className="bg-mist border-stone aspect-[4/3] overflow-hidden rounded-2xl border">
                    <div className="text-ink/40 flex h-full items-center justify-center p-8 text-center text-xs italic">
                      {featured.imageAlt}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-amber text-xs font-medium uppercase tracking-[0.2em]">
                      Featured
                    </p>
                    <h2 className="text-ink group-hover:text-sage mt-3 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                      {featured.title}
                    </h2>
                    <p className="text-ink/75 mt-4 leading-relaxed">
                      {featured.dek}
                    </p>
                    <p className="text-ink/60 mt-6 text-sm">
                      By {featured.byline}
                    </p>
                    <span className="text-amber group-hover:text-sage mt-6 inline-block text-sm">
                      Read the piece →
                    </span>
                  </div>
                </Link>
              )}

              {/* Article grid */}
              {rest.length > 0 && (
                <div className="mt-16 grid gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-3">
                  {rest.map((article) => (
                    <Link
                      key={article.slug}
                      href="#"
                      className="group"
                    >
                      <div className="bg-mist border-stone aspect-[4/3] overflow-hidden rounded-2xl border">
                        <div className="text-ink/40 flex h-full items-center justify-center p-6 text-center text-xs italic">
                          {article.imageAlt}
                        </div>
                      </div>
                      <p className="text-sage mt-4 text-xs font-medium uppercase tracking-[0.2em]">
                        {data.name}
                      </p>
                      <h3 className="text-ink group-hover:text-sage mt-2 font-serif text-xl font-medium leading-snug tracking-tight">
                        {article.title}
                      </h3>
                      <p className="text-ink/70 mt-2 text-sm leading-relaxed">
                        {article.dek}
                      </p>
                      <p className="text-ink/60 mt-3 text-xs">
                        By {article.byline}
                      </p>
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
                  We&apos;re still writing the first pieces for {data.name}.
                </h2>
                <p className="text-ink/75 mt-4 leading-relaxed">
                  Join your kin and we&apos;ll send them when they&apos;re
                  ready. One quiet email, no spam, unsubscribe in one tap.
                </p>
                <form className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    placeholder="Email address"
                    required
                    className="text-ink placeholder:text-ink/50 border-stone flex-1 rounded-full border bg-white px-5 py-3 text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-amber rounded-full px-6 py-3 text-sm text-white hover:opacity-90"
                  >
                    Join the list
                  </button>
                </form>
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
                  {pillarData[p].name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter (same as homepage) */}
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
            <form className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Email address"
                className="text-ink placeholder:text-ink/50 flex-1 rounded-full bg-white px-5 py-3 text-sm focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-amber rounded-full px-6 py-3 text-sm text-white hover:opacity-90"
              >
                Join the list
              </button>
            </form>
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