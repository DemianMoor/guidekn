import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "About — Guide Kin",
  description:
    "A free community for adults 35+ figuring out what's next. Honest writing on the things that actually matter at this stage — sourced, plainspoken, and from people who've been there.",
};

const principles = [
  {
    eyebrow: "Free, always",
    title: "No paywall, no upsell",
    body: "Guide Kin is free and stays free. We pay for it through advertising on the site and in our emails — only from companies we'd actually recommend to a friend.",
  },
  {
    eyebrow: "Sourced",
    title: "Research-backed, plainspoken",
    body: "Every piece cites its sources and acknowledges where the science is still mixed. We'd rather say 'we don't know yet' than pretend we do.",
  },
  {
    eyebrow: "Yours, not ours",
    title: "We don't sell your data",
    body: "Your email, your phone, your reading habits — they stay with us. We don't need to sell them, and we won't.",
  },
];

const team = [
  { name: "Maya Okafor", role: "Editor in chief" },
  { name: "Theo Williams", role: "Senior writer" },
  { name: "Ines Marchetti", role: "Travel & Roam" },
  { name: "Dr. Elena Park", role: "Body & Mind" },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              About
            </p>
            <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-6xl">
              What Guide Kin is, and isn&apos;t.
            </h1>
            <p className="text-ink/75 mx-auto mt-8 max-w-xl text-lg leading-relaxed">
              A free community for adults 35+ figuring out what&apos;s next.
              Honest writing on the things that actually matter at this stage
              — sourced, plainspoken, and from people who&apos;ve been there.
            </p>
          </div>
        </section>

        {/* What we are */}
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:gap-16 md:py-28">
            {/* Image placeholder */}
            <div className="bg-mist border-stone aspect-[4/5] overflow-hidden rounded-2xl border">
              <div className="text-ink/40 flex h-full items-center justify-center p-8 text-center text-xs italic">
                Editorial photo: a small group of writers and editors in
                their 40s and 50s in a sunlit kitchen, mid-conversation,
                real and unposed
              </div>
            </div>

            {/* Copy */}
            <div className="flex flex-col justify-center">
              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                What we are
              </p>
              <h2 className="text-ink mt-3 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                A quieter thing, written for the years that actually matter.
              </h2>
              <div className="prose-editorial mt-6 space-y-5 text-ink/80">
                <p>
                  We write about six things: your body, your mind, the way
                  you present yourself to the world, where you go, who you
                  keep close, and the years themselves. Health, wellness,
                  beauty, travel, relationships, aging — but not in those
                  words, because those words have been used badly for a
                  long time.
                </p>
                <p>
                  We&apos;re not a magazine telling you to defy your age.
                  We&apos;re not a wellness brand selling you a supplement.
                  We&apos;re not a social platform that needs you to argue
                  with strangers. We&apos;re a quieter thing — research-backed
                  writing, plainspoken, sent to your inbox or your phone when
                  there&apos;s something worth saying.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How we work */}
        <section className="bg-mist border-b border-stone">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="max-w-2xl">
              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                How we work
              </p>
              <h2 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
                Three things we promise our kin.
              </h2>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
              {principles.map((p) => (
                <div
                  key={p.eyebrow}
                  className="bg-cream border-stone rounded-2xl border p-8"
                >
                  <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                    {p.eyebrow}
                  </p>
                  <h3 className="text-ink mt-3 font-serif text-xl font-medium leading-snug tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-ink/75 mt-3 text-sm leading-relaxed">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The team */}
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="max-w-2xl">
              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                The team
              </p>
              <h2 className="text-ink mt-3 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                A small team, mostly in the audience we&apos;re writing for.
              </h2>
              <p className="text-ink/75 mt-4">
                Writers, editors, and researchers who are themselves figuring
                out what&apos;s next. We use AI as a research assistant and
                first-draft tool. Every piece is reviewed and shaped by a
                human before it reaches you.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
              {team.map((member) => (
                <div key={member.name} className="text-center">
                  <div className="bg-mist border-stone mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-full border">
                    <div className="text-ink/40 flex h-full items-center justify-center p-4 text-center text-[10px] italic leading-tight">
                      Portrait of {member.name}
                    </div>
                  </div>
                  <p className="text-ink mt-4 font-serif text-base font-medium">
                    {member.name}
                  </p>
                  <p className="text-ink/60 text-xs">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-sage">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
            <p className="text-mist text-xs font-medium uppercase tracking-[0.2em]">
              Join us
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight text-white md:text-4xl">
              Read what&apos;s worth your time.
            </h2>
            <p className="text-mist/90 mx-auto mt-4 max-w-xl">
              One quiet email a week. No noise, no upsell — just something
              worth your Sunday morning.
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