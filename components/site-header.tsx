import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-stone bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-sage text-xl font-medium tracking-tight"
        >
          Guide Kin
        </Link>
        <nav className="flex items-center gap-6 text-sm md:gap-8">
          <Link href="/about" className="text-ink hover:text-sage">
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
  );
}