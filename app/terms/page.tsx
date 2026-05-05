import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Terms of Service — Guide Kin",
  description: "The terms for using Guide Kin.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              Terms of Service
            </p>
            <h1 className="text-ink mt-4 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              The rules of the road.
            </h1>
            <p className="text-ink/60 mt-4 text-sm">
              Last updated: [DATE]. Operated by Yelow Sp. z o.o.
            </p>

            <div className="prose-editorial text-ink/80 mt-12 space-y-6">
              <p className="text-amber bg-mist border-stone rounded-xl border p-4 text-sm">
                <strong>Placeholder notice:</strong> This is template text
                only. Replace with real Terms of Service before public
                launch — drafted by counsel or generated through a service
                like Termly or iubenda.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Acceptance
              </h2>
              <p>
                By using Guide Kin (the site, emails, SMS, or any related
                services), you agree to these terms. If you don&apos;t,
                please don&apos;t use the service.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                The service
              </h2>
              <p>
                Guide Kin is a free editorial publication for adults 35+,
                operated by Yelow Sp. z o.o. We publish articles on six
                topic pillars: Body, Mind, Glow, Roam, Bonds, and Years.
                We send a weekly email digest, optional SMS digest, and
                occasional content alerts to subscribers.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                SMS messaging
              </h2>
              <p>
                SMS service is currently U.S.-only. By opting into SMS,
                you consent to receive automated text messages at the
                number you provided. Frequency varies, typically one
                message per week. Message and data rates may apply.
                Reply STOP to unsubscribe at any time. Reply HELP for
                help. Consent to SMS is not a condition of using Guide
                Kin or accessing our content.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Editorial content
              </h2>
              <p>
                Guide Kin&apos;s articles are for informational purposes
                only. Nothing on this site constitutes medical, legal,
                financial, or professional advice. Always consult a
                qualified professional for advice specific to your
                situation.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Advertising
              </h2>
              <p>
                Guide Kin is funded by advertising on the site and in our
                emails. We mark sponsored content clearly. We do not
                accept advertising from companies we wouldn&apos;t
                recommend to a friend.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Intellectual property
              </h2>
              <p>
                All Guide Kin content — articles, photography, design —
                is the property of Yelow Sp. z o.o. unless otherwise
                noted. You may share links to articles freely. Please
                don&apos;t republish full articles without permission.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Termination
              </h2>
              <p>
                You can unsubscribe and stop using Guide Kin at any time.
                We reserve the right to suspend access for users who
                violate these terms.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Liability
              </h2>
              <p>
                Guide Kin is provided &quot;as is.&quot; To the fullest
                extent permitted by law, Yelow Sp. z o.o. is not liable
                for any indirect or consequential damages arising from
                use of the service.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Governing law
              </h2>
              <p>
                These terms are governed by the laws of Poland.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Contact
              </h2>
              <p>
                Questions about these terms? Email [contact email].
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}