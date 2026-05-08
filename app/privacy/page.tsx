import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Privacy Policy",
  description: "How Guide Kin collects, uses, and protects your information.",
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
              Effective Date: April 2, 2026
            </p>

            <div className="prose-editorial text-ink/85 mt-12 space-y-6">
              <p>
                This Privacy Policy explains how <strong>Guide Kin</strong>{" "}
                (&ldquo;Guide Kin,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
                or &ldquo;our&rdquo;) collects, uses, and discloses
                personal information when you visit{" "}
                <strong>guidekn.com</strong> (the &ldquo;Site&rdquo;), or
                when you subscribe to receive email or text (SMS)
                notifications and other communications from us
                (collectively, the &ldquo;Services&rdquo;).
              </p>
              <p>
                Guide Kin is a free editorial publication for adults 35+,
                covering six lifestyle pillars: Body (health), Mind
                (wellness), Glow (beauty), Roam (travel), Bonds
                (relationships), and Years (aging). The Services are
                intended for residents of the United States only. By
                using the Services, you confirm that you are located in
                the United States and are at least 18 years of age.
              </p>
              <p>
                If you do not agree with this Privacy Policy, please do
                not use the Services or provide personal information to
                us.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                1) Who We Are / Contact
              </h2>
              <p><strong>Brand:</strong> Guide Kin</p>
              <p><strong>Website:</strong> guidekn.com</p>
              <p><strong>Legal Entity:</strong> Yelow Sp. z o.o.</p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:hello@guidekn.com" className="text-amber hover:text-sage">
                  hello@guidekn.com
                </a>
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <a href="tel:+15407397346" className="text-amber hover:text-sage">
                  +1 (540) 739-7346
                </a>
              </p>
              <p>
                <strong>Address:</strong> Warszawska 6 / 32, 15-063
                Bialystok, Podlaskie, Poland
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                2) What This Policy Covers (and What It Doesn&apos;t)
              </h2>
              <p>
                This Privacy Policy applies to information we collect
                through the Services.
              </p>
              <p>It does not apply to:</p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Third-party websites, apps, or services we link to; or</li>
                <li>Third-party products, retailers, or checkout experiences you may access via our links.</li>
              </ul>
              <p>
                We encourage you to review the privacy policies of any
                third parties you interact with.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                3) Personal Information We May Collect
              </h2>
              <p>
                &ldquo;Personal information&rdquo; means information that
                identifies you or reasonably relates to an identifiable
                individual.
              </p>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                A. Information you provide
              </h3>
              <p>We may collect:</p>
              <ul className="ml-6 list-disc space-y-2">
                <li><strong>Identifiers and contact information</strong> (e.g., name, email address, mobile number, ZIP code)</li>
                <li><strong>Message content</strong> you submit (e.g., inquiries, customer support requests, SMS replies)</li>
                <li><strong>Preferences</strong> you choose to share (e.g., interests across our six content pillars: Body, Mind, Glow, Roam, Bonds, Years)</li>
              </ul>
              <p>
                <strong>
                  Please do not submit sensitive medical information
                </strong>{" "}
                through our forms or by text message. Guide Kin is not a
                healthcare provider, our content is for informational
                purposes only, and the Services are not designed to
                receive or process protected health information under
                HIPAA. Information you submit to us through the Services
                is not protected by HIPAA.
              </p>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                B. Information collected automatically
              </h3>
              <p>When you use the Site, we may collect:</p>
              <ul className="ml-6 list-disc space-y-2">
                <li><strong>Device and browser information</strong> (e.g., IP address, device type, browser type, operating system)</li>
                <li><strong>Usage data</strong> (e.g., pages viewed, links clicked, time spent, referring URLs)</li>
                <li><strong>Approximate location</strong> derived from IP address (city/state level)</li>
              </ul>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                C. Cookies and similar technologies
              </h3>
              <p>
                We may use cookies, pixels, tags, SDKs, and similar
                technologies for:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Site functionality and security</li>
                <li>Analytics (understanding how the Site is used)</li>
                <li>Remembering your preferences</li>
                <li>Measuring email engagement (e.g., open and click rates)</li>
              </ul>
              <p>
                You can control cookies via your browser settings. If you
                disable cookies, some features may not work properly. For
                information about your choices regarding interest-based
                advertising, you may visit the Digital Advertising
                Alliance at optout.aboutads.info or the Network
                Advertising Initiative at optout.networkadvertising.org.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                4) How We Collect Personal Information
              </h2>
              <p>We may collect personal information:</p>
              <ul className="ml-6 list-disc space-y-2">
                <li>When you fill out a form, subscribe, or otherwise interact with the Site</li>
                <li>When you opt in to receive SMS or email communications</li>
                <li>When you contact us for customer support</li>
                <li>Automatically via cookies, server logs, and similar technologies</li>
              </ul>
              <p>
                If you provide information about another person (for
                example, a family member), you represent that you have
                the authority to do so.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                5) How We Use Personal Information
              </h2>
              <p>We may use personal information to:</p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Provide, operate, maintain, and improve the Services</li>
                <li>Send you requested updates, including newsletters, editorial content, sponsored content, and related communications across our six pillars (Body, Mind, Glow, Roam, Bonds, Years)</li>
                <li>Administer and support our SMS and email programs (see Sections 7 and 8)</li>
                <li>Personalize content and offers based on your preferences and engagement</li>
                <li>Respond to questions, requests, or customer support issues</li>
                <li>Monitor, prevent, and investigate fraud, abuse, security incidents, and policy violations</li>
                <li>Comply with legal obligations and enforce our terms and policies</li>
              </ul>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                6) How We Disclose Personal Information
              </h2>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                A. We do not sell your personal information
              </h3>
              <p>
                Guide Kin does not sell your personal information for
                money. We also do not &ldquo;share&rdquo; your personal
                information for cross-context behavioral advertising as
                those terms are defined under California law.
              </p>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                B. Service providers (processors)
              </h3>
              <p>
                We may disclose personal information to vendors that
                perform services for us, such as:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Website hosting and infrastructure</li>
                <li>Analytics and performance measurement</li>
                <li>Email service providers and marketing platforms</li>
                <li>Customer support tooling</li>
                <li>SMS delivery and compliance vendors</li>
                <li>Payment processors (where applicable)</li>
              </ul>
              <p>
                These parties may use personal information only to
                provide services to us, under contractual protections.
              </p>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                C. Legal, safety, and business transfers
              </h3>
              <p>We may disclose information:</p>
              <ul className="ml-6 list-disc space-y-2">
                <li>To comply with law, regulation, subpoena, or lawful government request</li>
                <li>To protect the rights, safety, and security of users, our business, or others</li>
                <li>In connection with a merger, acquisition, financing, reorganization, or sale of assets (subject to appropriate safeguards)</li>
              </ul>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                D. De-identified or aggregated information
              </h3>
              <p>
                We may share aggregated or de-identified information that
                cannot reasonably identify you.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                7) SMS / Text Messaging Privacy (Carrier-Friendly Disclosure)
              </h2>
              <p>
                If you choose to join our SMS program, we will use your
                mobile number and related data to send you text messages
                and to operate the program. By opting in, you provide
                your prior express written consent under the Telephone
                Consumer Protection Act (TCPA) to receive marketing text
                messages from Guide Kin sent using an automatic telephone
                dialing system or otherwise. Consent is not a condition
                of any purchase.
              </p>
              <p>
                <strong>Program purpose:</strong> editorial content,
                article alerts, sponsored content, and related
                communications across our six pillars (Body, Mind, Glow,
                Roam, Bonds, Years).
              </p>
              <p><strong>Message frequency:</strong> Message frequency varies.</p>
              <p><strong>Msg &amp; data rates may apply.</strong></p>
              <p>
                <strong>Opt-out:</strong> Reply <strong>STOP</strong> at
                any time to cancel.
              </p>
              <p>
                <strong>Help:</strong> Reply <strong>HELP</strong> for
                help, or contact <strong>hello@guidekn.com</strong>.
              </p>
              <p>
                <strong>Carrier disclaimer:</strong> Carriers are not
                liable for delayed or undelivered messages.
              </p>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                A. No marketing sharing of mobile data or opt-in data
              </h3>
              <p>
                To meet wireless-carrier expectations for messaging
                programs, we state clearly:
              </p>
              <p>
                <strong>
                  No mobile information will be sold or shared with third
                  parties or affiliates for marketing or promotional
                  purposes.
                </strong>
              </p>
              <p>
                <strong>
                  Text messaging originator opt-in data and consent will
                  not be shared with any third parties.
                </strong>
              </p>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                B. Who we do share SMS data with (limited)
              </h3>
              <p>
                We may share the minimum necessary information with
                vendors that help deliver and manage messages (for
                example, messaging platform providers, delivery vendors,
                and telecom carriers). These parties may use the data
                only to provide services to us (delivery, compliance,
                support, fraud prevention).
              </p>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                C. Retention for consent and compliance
              </h3>
              <p>
                We may retain records of SMS opt-in and opt-out events
                and message history as needed to:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>demonstrate consent,</li>
                <li>honor STOP requests,</li>
                <li>comply with legal and carrier requirements (including the TCPA), and</li>
                <li>prevent abuse.</li>
              </ul>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                8) Email Marketing Communications
              </h2>
              <p>
                If you sign up for our emails, you consent to receive
                marketing and promotional messages from Guide Kin. We
                comply with the federal CAN-SPAM Act, which means:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Our marketing emails identify Guide Kin as the sender and include a valid postal address.</li>
                <li>Subject lines accurately reflect the content of the email.</li>
                <li>Each marketing email contains a clear unsubscribe link.</li>
              </ul>
              <p>
                You can opt out at any time by clicking the unsubscribe
                link in any of our marketing emails or by emailing
                hello@guidekn.com with the subject line
                &ldquo;Unsubscribe.&rdquo; We will honor opt-out requests
                promptly, and in any event within 10 business days, as
                required by law.
              </p>
              <p>
                Some communications may be transactional or
                service-related (for example, responses to your support
                request or important Service notices), and you may not
                be able to opt out of those while you are using the
                Services.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                9) Digital Tracking and Analytics
              </h2>
              <p>
                We may use analytics tools (such as web analytics, tag
                managers, and similar measurement services) to understand
                Site usage and improve performance. These tools may
                collect device and usage information, including IP
                address, browser type, and page interactions.
              </p>
              <p>
                Some browsers offer a &ldquo;Do Not Track&rdquo; (DNT)
                signal. Because there is no industry-standard
                interpretation of DNT signals, our Site does not currently
                respond to DNT signals. Where required by law, we honor
                opt-out preference signals such as the Global Privacy
                Control (GPC).
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                10) Data Retention
              </h2>
              <p>
                We retain personal information for as long as necessary
                to provide the Services, comply with our legal
                obligations (including TCPA, CAN-SPAM, and applicable
                state laws), resolve disputes, and enforce our agreements.
                Retention periods vary based on the type of information
                and the purpose for which it was collected.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                11) Security
              </h2>
              <p>
                We use reasonable administrative, technical, and physical
                safeguards designed to protect personal information.
                However, no security system is perfect, and we cannot
                guarantee absolute security. You are responsible for
                keeping any account credentials confidential.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                12) Persons Under 18
              </h2>
              <p>
                Our Services are intended for individuals 18 years of age
                or older and located in the United States. We do not
                knowingly collect personal information from individuals
                under 18, and the Services are not directed to children
                under 13 within the meaning of the Children&apos;s Online
                Privacy Protection Act (COPPA). If you believe a minor
                has provided us information, contact us at
                hello@guidekn.com and we will take reasonable steps to
                delete it.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                13) U.S. State Privacy Rights
              </h2>
              <p>
                Depending on your state of residence (including, where
                applicable, California, Colorado, Connecticut, Virginia,
                Utah, Oregon, Texas, and other states with comprehensive
                privacy laws), you may have the right to:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>request access to the personal information we hold about you,</li>
                <li>request deletion of your personal information,</li>
                <li>request correction of inaccurate personal information,</li>
                <li>request a copy of your personal information in a portable format,</li>
                <li>opt out of the sale or sharing of personal information and of certain targeted advertising or profiling, where applicable, and</li>
                <li>receive information about our collection, use, and disclosure practices.</li>
              </ul>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                California – &ldquo;Shine the Light&rdquo;
              </h3>
              <p>
                California Civil Code Section 1798.83 permits California
                residents to request information regarding the disclosure
                of personal information to third parties for those
                parties&apos; direct marketing purposes. Guide Kin does
                not disclose personal information to third parties for
                their direct marketing purposes.
              </p>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                Do Not Sell or Share My Personal Information
              </h3>
              <p>
                Guide Kin does not sell personal information and does not
                share mobile opt-in data for third-party marketing (see
                Section 7). Where required by law, we honor opt-out
                preference signals such as the Global Privacy Control
                (GPC).
              </p>

              <h3 className="text-ink mt-6 font-serif text-xl font-medium tracking-tight">
                How to Submit a Request
              </h3>
              <p>
                To submit a privacy request, email{" "}
                <strong>hello@guidekn.com</strong> with the subject line{" "}
                <strong>&ldquo;Privacy Request.&rdquo;</strong> We may
                need to verify your identity before completing your
                request. You may use an authorized agent to submit a
                request on your behalf where state law permits; we may
                require proof of authorization.
              </p>
              <p>
                <strong>Non-discrimination:</strong> We will not
                discriminate against you for exercising your privacy
                rights.
              </p>
              <p>
                <strong>Appeals:</strong> If we deny your request, you
                may appeal our decision by replying to our denial email.
                Where state law provides a right to contact a state
                regulator if your appeal is denied, that right will be
                described in our response.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                14) Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We
                will post the updated policy on this page and update the
                &ldquo;Effective Date&rdquo; above. Your continued use of
                the Services after the updated policy is posted means you
                accept the updated policy.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                15) Contact Us
              </h2>
              <p>
                Questions or requests regarding privacy can be sent to:
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:hello@guidekn.com" className="text-amber hover:text-sage">
                  hello@guidekn.com
                </a>
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <a href="tel:+15407397346" className="text-amber hover:text-sage">
                  +1 (540) 739-7346
                </a>
              </p>
              <p className="text-ink/70 mt-12">
                — the Guide Kin team
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}