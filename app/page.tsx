import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const pillars = [
  { slug: "body", name: "Body", blurb: "Strength, sleep, and moving for the long road." },
  { slug: "mind", name: "Mind", blurb: "Focus, calm, and what we actually pay attention to." },
  { slug: "glow", name: "Glow", blurb: "Skin, style, and showing up like yourself." },
  { slug: "roam", name: "Roam", blurb: "Trips, weekends, and going somewhere on purpose." },
  { slug: "bonds", name: "Bonds", blurb: "Friendships, family, and the people who know you." },
  { slug: "years", name: "Years", blurb: "Money, work, and what's next — without the noise." },
];

const featured = {
  pillar: "Bonds",
  pillarSlug: "bonds",
  title: "How to make new friends in your forties without it feeling weird",
  dek: "The research is clear: deep friendships built after 35 take work, time, and a particular kind of honesty most of us forgot how to use. Three writers share what actually moved the needle for them.",
  byline: "Maya Okafor",
  imageAlt: "Four friends gathered around a wooden dinner table at golden hour, mid-conversation",
};

const articles = [
  {
    pillar: "Body",
    pillarSlug: "body",
    title: "The case for getting strong, not skinny",
    dek: "Why lifting heavy after 40 is the most quietly transformative thing most of us aren't doing yet.",
    byline: "Dr. Elena Park",
    imageAlt: "Woman in her early fifties lifting a kettlebell in a sunlit home gym",
  },
  {
    pillar: "Mind",
    pillarSlug: "mind",
    title: "Reading more, scrolling less: a quiet rebellion",
    dek: "How a small group of our readers traded their phones for paperbacks — and what they noticed in the first month.",
    byline: "Theo Williams",
    imageAlt: "Man in his sixties reading a paperback by a sunlit window with a coffee mug",
  },
  {
    pillar: "Roam",
    pillarSlug: "roam",
    title: "On going somewhere alone, and what you learn there",
    dek: "Five kin write about taking their first solo trip after 45. None of them came back the same person.",
    byline: "Ines Marchetti",
    imageAlt: "Woman walking alone through a quiet European cobblestone street in early morning light",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="bg-cream relative overflow-hidden border-b border-stone">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
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
              <Link
                href="#"
                className="text-amber hover:text-sage hidden text-sm md:inline"
              >
                All stories →
              </Link>
            </div>

            {/* Featured */}
            <Link
              href="#"
              className="group mt-10 grid gap-8 border-b border-stone pb-12 md:grid-cols-2"
            >
              <div className="bg-mist border-stone aspect-[4/3] overflow-hidden rounded-2xl border">
                <div className="text-ink/40 flex h-full items-center justify-center p-8 text-center text-xs italic">
                  {featured.imageAlt}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                  {featured.pillar}
                </p>
                <h3 className="text-ink group-hover:text-sage mt-3 font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl">
                  {featured.title}
                </h3>
                <p className="text-ink/75 mt-4 leading-relaxed">{featured.dek}</p>
                <p className="text-ink/60 mt-6 text-sm">By {featured.byline}</p>
              </div>
            </Link>

            {/* Article grid */}
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {articles.map((a) => (
                <Link key={a.title} href="#" className="group">
                  <div className="bg-mist border-stone aspect-[4/3] overflow-hidden rounded-2xl border">
                    <div className="text-ink/40 flex h-full items-center justify-center p-6 text-center text-xs italic">
                      {a.imageAlt}
                    </div>
                  </div>
                  <p className="text-sage mt-4 text-xs font-medium uppercase tracking-[0.2em]">
                    {a.pillar}
                  </p>
                  <h3 className="text-ink group-hover:text-sage mt-2 font-serif text-xl font-medium leading-snug tracking-tight">
                    {a.title}
                  </h3>
                  <p className="text-ink/70 mt-2 text-sm leading-relaxed">{a.dek}</p>
                  <p className="text-ink/60 mt-3 text-xs">By {a.byline}</p>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center md:hidden">
              <Link href="#" className="text-amber hover:text-sage text-sm">
                All stories →
              </Link>
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