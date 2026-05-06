import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSiteSettings } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About",
  description:
    "What Guide Kin is, and isn't. A free community for adults 35+ figuring out what's next.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              About
            </p>
            <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-6xl">
              What Guide Kin is, and isn&apos;t.
            </h1>
            <p className="text-ink/75 mx-auto mt-8 max-w-2xl text-lg leading-relaxed">
              A free community for adults 35+ figuring out what&apos;s next.
              Honest writing on the things that actually matter at this stage —
              sourced, plainspoken, and from people who&apos;ve been there.
            </p>
          </div>
        </section>

        {/* Hero image */}
        {settings.about_hero_image && (
          <section className="bg-mist">
            <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.about_hero_image}
                alt=""
                className="aspect-[16/9] w-full rounded-2xl object-cover"
              />
            </div>
          </section>
        )}

        {/* What we are */}
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              What we are
            </p>
            <h2 className="text-ink mt-3 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
              A quieter thing, written for the years that actually matter.
            </h2>
            <div className="text-ink/85 mt-8 space-y-5 leading-relaxed md:text-lg">
              <p>
                We write about six things: your body, your mind, the way you
                present yourself to the world, where you go, who you keep
                close, and the years themselves. Health, wellness, beauty,
                travel, relationships, aging — but not in those words, because
                those words have been used badly for a long time.
              </p>
              <p>
                We&apos;re not a magazine telling you to defy your age.
                We&apos;re not a wellness brand selling you a supplement.
                We&apos;re not a social platform that needs you to argue with
                strangers. We&apos;re a quieter thing — research-backed
                writing, plainspoken, sent to your inbox or your phone when
                there&apos;s something worth saying.
              </p>
            </div>
          </div>
        </section>

        {/* How we work */}
        <section className="bg-mist border-b border-stone">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              How we work
            </p>
            <h2 className="text-ink mt-3 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
              Three things we promise our kin.
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  eyebrow: "Free, always",
                  title: "No paywall, no upsell",
                  body:
                    "Guide Kin is free and stays free. We pay for it through advertising on the site and in our emails — only from companies we'd actually recommend to a friend.",
                },
                {
                  eyebrow: "Sourced",
                  title: "Research-backed, plainspoken",
                  body:
                    "Every piece cites its sources and acknowledges where the science is still mixed. We'd rather say 'we don't know yet' than pretend we do.",
                },
                {
                  eyebrow: "Yours, not ours",
                  title: "We don't sell your data",
                  body:
                    "Your email, your phone, your reading habits — they stay with us. We don't need to sell them, and we won't.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-cream border-stone rounded-2xl border p-6 md:p-8"
                >
                  <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                    {item.eyebrow}
                  </p>
                  <h3 className="text-ink mt-3 font-serif text-lg font-medium tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-ink/75 mt-3 text-sm leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

       
        {/* CTA */}
        <section className="bg-sage">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
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