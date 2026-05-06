import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "SMS Terms & Conditions",
  description: "Terms governing the Guide Kin SMS program.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              SMS Terms &amp; Conditions
            </p>
            <h1 className="text-ink mt-4 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              Guide Kin SMS Terms &amp; Conditions
            </h1>
            <p className="text-ink/60 mt-4 text-sm">
              Effective Date: April 2, 2026
            </p>

            <div className="prose-editorial text-ink/85 mt-12 space-y-6">
              <p>
                These SMS Terms and Conditions (&ldquo;SMS Terms&rdquo;)
                govern your participation in the Guide Kin text-messaging
                program (the &ldquo;Program&rdquo;) operated by{" "}
                <strong>Yelow Sp. z o.o.</strong> (&ldquo;Guide Kin,&rdquo;
                &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
                The Program is offered only to individuals located in the
                United States who are 18 years of age or older. By
                enrolling in the Program, you agree to these SMS Terms
                and to our Privacy Policy available at{" "}
                <Link href="/privacy" className="text-amber hover:text-sage">
                  https://guidekn.com/privacy
                </Link>.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                1) Program Description
              </h2>
              <p>
                The Guide Kin SMS Program delivers editorial content,
                article alerts, sponsored content, and related
                communications across our six lifestyle pillars: Body
                (health), Mind (wellness), Glow (beauty), Roam (travel),
                Bonds (relationships), and Years (aging). Messages are
                for informational and editorial purposes only and do not
                constitute medical, health, legal, financial, or other
                professional advice. Always consult a qualified
                professional before making decisions about your health,
                finances, or other matters where professional advice is
                appropriate.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                2) Consent to Receive Messages
              </h2>
              <p>
                By providing your mobile number and opting in to the
                Program (for example, by submitting an SMS sign-up form
                on guidekn.com or by texting our keyword to our short
                code or number), you provide your prior express written
                consent under the federal Telephone Consumer Protection
                Act (TCPA) to receive recurring marketing and promotional
                text messages from Guide Kin sent using an automatic
                telephone dialing system or otherwise. You confirm that
                you are the subscriber of the mobile number provided or
                are authorized to provide it.
              </p>
              <p>
                <strong>
                  Consent is not a condition of any purchase.
                </strong>{" "}
                You may receive messages from Guide Kin even if you have
                not made a purchase, provided you have opted in.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                3) Message Frequency
              </h2>
              <p>
                Message frequency varies. By default, you may receive
                multiple messages per week. Message content will include
                informational, marketing, and promotional texts.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                4) Message and Data Rates
              </h2>
              <p>
                Message and data rates may apply for any messages sent to
                you from Guide Kin and to Guide Kin from you. If you have
                any questions about your text plan or data plan, please
                contact your wireless provider. Guide Kin is not
                responsible for any wireless carrier charges.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                5) Opting Out (STOP)
              </h2>
              <p>
                You can cancel the SMS service at any time. Just text{" "}
                <strong>&ldquo;STOP&rdquo;</strong> to the short code or
                number from which you receive our messages. After you
                send the SMS message &ldquo;STOP&rdquo; to us, we will
                send you an SMS message to confirm that you have been
                unsubscribed. After this, you will no longer receive SMS
                messages from us through the Program. If you want to join
                again, just sign up as you did the first time, and we will
                start sending SMS messages to you again.
              </p>
              <p>
                Other recognized opt-out keywords include END, CANCEL,
                UNSUBSCRIBE, and QUIT. Opt-out requests apply to the
                Program from which you opt out. If you participate in
                more than one Guide Kin messaging program, you may need
                to opt out separately from each.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                6) Getting Help (HELP)
              </h2>
              <p>
                If you are experiencing issues with the messaging program,
                you can reply with the keyword{" "}
                <strong>&ldquo;HELP&rdquo;</strong> for more assistance,
                or you can get help directly at{" "}
                <strong>hello@guidekn.com</strong>.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                7) Supported Carriers and Carrier Liability
              </h2>
              <p>
                The Program is generally available on major U.S. wireless
                carriers, including (but not limited to) AT&amp;T, Verizon
                Wireless, T-Mobile, US Cellular, and their applicable
                affiliates and resellers. Carriers are not liable for
                delayed or undelivered messages. Carrier participation is
                subject to change without notice.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                8) Eligibility
              </h2>
              <p>To participate in the Program, you must:</p>
              <ul className="ml-6 list-disc space-y-2">
                <li>be at least 18 years of age,</li>
                <li>be located in the United States,</li>
                <li>be the subscriber of the mobile number provided, or be authorized by the subscriber to enroll that number, and</li>
                <li>agree to these SMS Terms and our Privacy Policy.</li>
              </ul>
              <p>
                If you change or deactivate the mobile number provided to
                us, you agree to promptly update your information by
                texting STOP from that number or by emailing
                hello@guidekn.com to avoid messages being sent to a
                person who is not the intended subscriber.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                9) Privacy
              </h2>
              <p>
                If you have any questions regarding privacy, please read
                our{" "}
                <Link href="/privacy" className="text-amber hover:text-sage">
                  Privacy Policy
                </Link>
                .
              </p>
              <p>
                <strong>
                  No mobile information will be sold or shared with third
                  parties or affiliates for marketing or promotional
                  purposes.
                </strong>{" "}
                Text messaging originator opt-in data and consent will
                not be shared with any third parties, except with vendors
                that help us deliver and operate the Program (for
                example, messaging platform providers, delivery vendors,
                and telecom carriers), and only as needed for those
                services.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                10) No Medical or Professional Advice
              </h2>
              <p>
                Guide Kin is not a healthcare provider, financial advisor,
                or legal professional, and the Program is not designed to
                receive or transmit protected health information under
                HIPAA. Information delivered through the Program is
                provided for general informational and editorial purposes
                only and is not a substitute for professional medical,
                legal, financial, or other professional advice. Always
                seek the advice of a qualified professional with any
                questions you may have regarding your health, finances,
                or other matters. Never disregard professional advice or
                delay in seeking it because of something you received
                through the Program.
              </p>
              <p>
                Please do not send sensitive medical or personal
                information by text. We cannot guarantee the security of
                information transmitted by SMS.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                11) Disclaimer of Warranties
              </h2>
              <p>
                THE PROGRAM IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND
                &ldquo;AS AVAILABLE&rdquo; BASIS. TO THE FULLEST EXTENT
                PERMITTED BY LAW, GUIDE KIN AND ITS AFFILIATES, AND THEIR
                RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS,
                DISCLAIM ALL WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
                INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTY
                THAT MESSAGES WILL BE TIMELY, UNINTERRUPTED, OR
                ERROR-FREE.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                12) Limitation of Liability
              </h2>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, GUIDE KIN AND ITS
                AFFILIATES, AND THEIR RESPECTIVE OFFICERS, DIRECTORS,
                EMPLOYEES, AND AGENTS, WILL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                DAMAGES ARISING OUT OF OR RELATING TO THE PROGRAM,
                INCLUDING BUT NOT LIMITED TO LOST PROFITS, LOST DATA, OR
                DELAYED OR UNDELIVERED MESSAGES, EVEN IF ADVISED OF THE
                POSSIBILITY OF SUCH DAMAGES. SOME JURISDICTIONS DO NOT
                ALLOW THE EXCLUSION OF CERTAIN DAMAGES, SO SOME OF THESE
                LIMITATIONS MAY NOT APPLY TO YOU.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                13) Changes to the Program or These SMS Terms
              </h2>
              <p>
                We may modify or terminate the Program, or update these
                SMS Terms, at any time, with or without notice. Your
                continued participation in the Program after any changes
                are posted on guidekn.com constitutes your acceptance of
                the updated SMS Terms. If we make a material change that
                affects your rights, we will use reasonable efforts to
                notify you, including (where appropriate) by SMS or
                email.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                14) Governing Law and Dispute Resolution
              </h2>
              <p>
                These SMS Terms and any dispute arising out of or relating
                to the Program will be governed by the laws of the State
                of Delaware, without regard to its conflict of laws
                principles, and by applicable U.S. federal law (including
                the TCPA). Subject to any applicable mandatory consumer
                protection laws, you and Guide Kin agree to the exclusive
                jurisdiction of the state and federal courts located in
                the State of Delaware for the resolution of any dispute
                that is not otherwise required to be resolved as set
                forth below.
              </p>

              <h2 className="text-ink mt-12 font-serif text-2xl font-medium tracking-tight">
                15) Contact Us
              </h2>
              <p>
                If you have questions about these SMS Terms or the
                Program, please contact us:
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:hello@guidekn.com" className="text-amber hover:text-sage">
                  hello@guidekn.com
                </a>
              </p>
              <p>
                <strong>Website:</strong> https://guidekn.com
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