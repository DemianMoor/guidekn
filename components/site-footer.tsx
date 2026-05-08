import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-cream border-t border-stone mt-20">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-sage text-xl font-medium tracking-tight">
              Guide Kin
            </p>
            <p className="text-ink/70 mt-3 max-w-xs text-sm">
              Live well, longer.
            </p>
            <p className="text-ink/70 mt-4 text-sm">
              <a
                href="tel:+15407397346"
                className="hover:text-sage"
              >
                (540) 739-7346
              </a>
            </p>
            <p className="text-ink/50 mt-4 text-xs">
              Operated by Yelow Sp. z o.o.
            </p>
          </div>

          {/* Pillars */}
          <div>
            <p className="text-ink/50 text-xs font-medium uppercase tracking-wider">
              Read
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/body" className="text-ink hover:text-sage">Body</Link></li>
              <li><Link href="/mind" className="text-ink hover:text-sage">Mind</Link></li>
              <li><Link href="/glow" className="text-ink hover:text-sage">Glow</Link></li>
              <li><Link href="/roam" className="text-ink hover:text-sage">Roam</Link></li>
              <li><Link href="/bonds" className="text-ink hover:text-sage">Bonds</Link></li>
              <li><Link href="/years" className="text-ink hover:text-sage">Years</Link></li>
            </ul>
          </div>

          {/* Guide Kin links */}
          <div>
            <p className="text-ink/50 text-xs font-medium uppercase tracking-wider">
              Guide Kin
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="text-ink hover:text-sage">About</Link></li>
              <li><Link href="/subscribe" className="text-ink hover:text-sage">Subscribe</Link></li>
              <li><Link href="/privacy" className="text-ink hover:text-sage">Privacy</Link></li>
              <li><Link href="/terms" className="text-ink hover:text-sage">SMS Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="text-ink/60 mt-12 flex flex-col items-start justify-between gap-2 border-t border-stone pt-6 text-xs md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Guide Kin. Written for our kin.</p>
          <p>— the Guide Kin team</p>
        </div>
      </div>
    </footer>
  );
}