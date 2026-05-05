import Link from "next/link";

const pillars = [
  { slug: "body", name: "Body", blurb: "Health that holds up." },
  { slug: "mind", name: "Mind", blurb: "Clarity, focus, and peace of mind." },
  { slug: "glow", name: "Glow", blurb: "Looking like yourself, only better." },
  { slug: "roam", name: "Roam", blurb: "Travel that earns the trip." },
  { slug: "bonds", name: "Bonds", blurb: "The relationships that matter." },
  { slug: "years", name: "Years", blurb: "Living well, longer." },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-stone">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-sage text-xl font-medium tracking-tight">
            guidekin
          </Link>
          <nav className="flex items-center gap-8 text-sm">
            <Link href="/about" className="hover:text-sage">
              About
            </Link>
            <Link
              href="/subscribe"
              className="bg-amber rounded-full px-4 py-2 text-white hover:opacity-90"
            >
              Subscribe
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-ink text-5xl font-medium tracking-tight md:text-6xl">
          Guidance from people who get it.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">
          A free community for adults 35+ figuring out what&apos;s next.
          Honest writing on the things that actually matter at this stage.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/subscribe"
            className="bg-sage rounded-full px-6 py-3 text-white hover:opacity-90"
          >
            Join your kin
          </Link>
          <Link
            href="/about"
            className="text-ink/70 hover:text-sage rounded-full border border-stone px-6 py-3"
          >
            What we&apos;re about
          </Link>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-mist border-y border-stone">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-ink text-3xl font-medium tracking-tight">
            Six things we write about
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <Link
                key={p.slug}
                href={`/${p.slug}`}
                className="group bg-cream rounded-2xl border border-stone p-6 transition hover:border-sage"
              >
                <h3 className="text-sage text-xl font-medium">{p.name}</h3>
                <p className="text-ink/70 mt-2">{p.blurb}</p>
                <span className="text-amber group-hover:text-sage mt-4 inline-block text-sm">
                  Read more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 py-12 text-sm text-ink/60">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} guidekin</p>
          <p>Live well, longer.</p>
        </div>
      </footer>
    </main>
  );
}