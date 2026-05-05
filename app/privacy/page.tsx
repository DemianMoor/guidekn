import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Privacy Policy — Guide Kin",
  description: "How Guide Kin handles your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              Privacy Policy
            </p>
            <h1 className="text-ink mt-4 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              How we handle your data.
            </h1>
            <p className="text-ink/60 mt-4 text-sm">
              Last updated: [DATE]. Operated by Yelow Sp. z o.o.
            </p>

            <div className="prose-editorial text-ink/80 mt-12 space-y-6">
              <p className="text-amber bg-mist border-stone rounded-xl border p-4 text-sm">
                <strong>Placeholder notice:</strong> This is template text
                only. Replace with a real Privacy Policy before public
                launch — drafted by counsel or generated through a service
                like Termly or iubenda. The headings below are the sections
                a Privacy Policy typically needs.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Who we are
              </h2>
              <p>
                Guide Kin is a free editorial publication operated by Yelow
                Sp. z o.o., a company registered in Poland. Contact:
                [contact email].
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                What we collect
              </h2>
              <p>
                When you subscribe, we collect: your name, email address,
                and (optionally) phone number. We also collect your
                preferences — which pillars you want to read about, and
                whether you opted into email and/or SMS communications.
              </p>
              <p>
                When you visit the site, our hosting provider may log basic
                technical information (IP address, browser type, pages
                visited) for security and analytics.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                How we use it
              </h2>
              <p>
                We use your contact information solely to send you the
                content you signed up for. We use your preferences to
                personalize what we send. We don&apos;t sell, rent, or
                otherwise share your data with third parties for marketing.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Service providers
              </h2>
              <p>
                We use third-party services to operate Guide Kin: [hosting
                provider], [email service provider], [SMS provider]. They
                process your data only to deliver our service to you, under
                their own privacy terms.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Your rights
              </h2>
              <p>
                You can unsubscribe from emails and SMS at any time. You
                can request deletion of your data by emailing [contact
                email]. You have the right to access, correct, or delete
                your personal data.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Cookies
              </h2>
              <p>
                Guide Kin uses minimal cookies — only those required for
                the site to function and to remember your preferences if
                you&apos;re signed in. We do not use third-party tracking
                or advertising cookies.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Changes to this policy
              </h2>
              <p>
                If we change how we handle your data, we&apos;ll update
                this page and email anyone affected.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                Contact
              </h2>
              <p>
                Questions about your data? Email [contact email].
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}