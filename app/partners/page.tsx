import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CURRENT_SUB_HEALTH_CONSENT } from "@/lib/consent/sub-health";

export const metadata = {
  title: "Our partners",
  description: "The partners whose Medicare, ACA, and health insurance offers GuideKin texts about.",
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
            <p className="text-ink/75 mt-6 leading-relaxed">
              When you agree to receive texts from GuideKin about Medicare,
              ACA, and health insurance offers, those offers come from the
              partners listed below. GuideKin is the only sender of these
              messages.
            </p>
            <ul className="text-ink/85 mt-8 list-disc space-y-2 pl-6">
              {consent.partners.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="text-ink/50 mt-10 text-xs">Consent version {consent.id}</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
