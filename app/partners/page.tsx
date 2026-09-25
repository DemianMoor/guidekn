import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CURRENT_SUB_HEALTH_CONSENT } from "@/lib/consent/sub-health";

export const metadata = {
  title: "Our partners",
  description: "Who the Medicare, ACA, and health coverage offers GuideKin texts about come from.",
  // Reached only from the /sub-health consent text.
  robots: { index: false, follow: false },
};

export default function PartnersPage() {
  const consent = CURRENT_SUB_HEALTH_CONSENT;
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <h1 className="text-ink font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              Our partners
            </h1>
            {typeof consent.partners === "string" ? (
              <p className="text-ink/75 mt-6 leading-relaxed">{consent.partners}</p>
            ) : (
              <ul className="text-ink/85 mt-8 list-disc space-y-2 pl-6">
                {consent.partners.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            <p className="text-ink/50 mt-10 text-xs">Consent version {consent.id}</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
