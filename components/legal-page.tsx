import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createSupabaseAdmin } from "@/lib/supabase";

/**
 * Legal/policy pages (privacy, terms) render from the admin-managed
 * `legal_pages` table. Content is edited centrally in the admin panel; this
 * site just reads the published row and renders its HTML body in brand chrome.
 */
export type LegalPageRow = {
  slug: string;
  title: string;
  body: string;
  effective_date: string | null;
  seo_description: string | null;
};

export async function fetchLegalPage(slug: string): Promise<LegalPageRow | null> {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("legal_pages")
    .select("slug,title,body,effective_date,seo_description")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as LegalPageRow) ?? null;
}

function formatDate(d: string | null): string | null {
  if (!d) return null;
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function LegalPageView({ page }: { page: LegalPageRow }) {
  const eff = formatDate(page.effective_date);
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <h1 className="text-ink font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              {page.title}
            </h1>
            {eff && <p className="text-ink/60 mt-4 text-sm">Effective Date: {eff}</p>}
            <div
              className="prose-editorial text-ink/85 mt-12 space-y-6"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
