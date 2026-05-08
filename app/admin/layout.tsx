import Link from "next/link";
import { getCurrentEditor } from "@/lib/admin-auth";
import { SignOutButton } from "./sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const editor = await getCurrentEditor();

  // If not signed in, render children directly (signin page handles its own UI)
  if (!editor) {
    return <>{children}</>;
  }

  return (
    <div className="bg-cream min-h-screen">
      {/* Top bar */}
      <header className="border-stone border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/admin"
            className="text-sage text-xl font-medium tracking-tight"
          >
            Guide Kin <span className="text-ink/50 ml-2 text-sm">/ admin</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-ink/70 hover:text-sage"
              target="_blank"
              rel="noopener"
            >
              View site ↗
            </Link>
            <span className="text-ink/40">|</span>
            <span className="text-ink/70">{editor.display_name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl px-6 py-8 gap-8">
        <aside className="w-48 flex-shrink-0">
          <nav className="space-y-1 text-sm">
            <Link
              href="/admin"
              className="text-ink hover:bg-mist block rounded-lg px-3 py-2 font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/articles"
              className="text-ink hover:bg-mist block rounded-lg px-3 py-2"
            >
              Articles
            </Link>
            <Link
              href="/admin/articles/import"
              className="text-ink hover:bg-mist block rounded-lg px-3 py-2"
            >
              Import
            </Link>
            <Link
              href="/admin/picks"
              className="text-ink hover:bg-mist block rounded-lg px-3 py-2"
            >
              Picks
            </Link>
            <Link
              href="/admin/subscribers"
              className="text-ink hover:bg-mist block rounded-lg px-3 py-2"
            >
              Subscribers
            </Link>
            <Link
              href="/admin/site-images"
              className="text-ink hover:bg-mist block rounded-lg px-3 py-2"
            >
              Site Images
            </Link>
            <Link
              href="/admin/landing-pages"
              className="text-ink hover:bg-mist block rounded-lg px-3 py-2"
            >
              Landing pages
            </Link>
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}