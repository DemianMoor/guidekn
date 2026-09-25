"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  ChoiceChips,
  ConsentCheckbox,
  Divider,
  FormError,
  SectionHint,
  SectionLabel,
  SubmitButton,
  SubscribeFormCard,
  SubscribeHero,
  SubscribeThankYou,
  TextField,
} from "@/components/subscribe/form-parts";

const PILLARS = [
  { slug: "body", name: "Body" },
  { slug: "mind", name: "Mind" },
  { slug: "glow", name: "Glow" },
  { slug: "roam", name: "Roam" },
  { slug: "bonds", name: "Bonds" },
  { slug: "years", name: "Years" },
];

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

export default function SubscribePage() {
  const [smsOpen, setSmsOpen] = useState(false);
  const [pillars, setPillars] = useState<string[]>([]);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  const togglePillar = (slug: string) => {
    setPillars((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("handleSubmit fired");
    setSubmit({ status: "submitting" });

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || null,
      pillars,
      consent_email: formData.get("consent_email") === "on",
      consent_sms: formData.get("consent_sms") === "on",
    };

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmit({
          status: "error",
          message: data.error || "Something went wrong. Please try again.",
        });
        return;
      }

      setSubmit({ status: "success" });
    } catch {
      setSubmit({
        status: "error",
        message: "Something went wrong. Please check your connection and try again.",
      });
    }
  };

  if (submit.status === "success") {
    return (
      <SubscribeThankYou eyebrow="You're in" title="Welcome to your kin.">
        We&apos;ve got you on the list. The first thing you&apos;ll
        hear from us is a short welcome email — keep an eye on your
        inbox over the next few minutes. After that, expect one
        quiet email a week.
      </SubscribeThankYou>
    );
  }

  return (
    <>
      <SiteHeader />

      <main>
        <SubscribeHero eyebrow="Subscribe" title="Join your kin.">
          Pick what you want to hear about, and how. Free, always. No
          spam, no selling your data, unsubscribe in one tap.
        </SubscribeHero>

        <SubscribeFormCard onSubmit={handleSubmit}>
          <SectionLabel>Who you are</SectionLabel>

          <div className="mt-6 space-y-5">
            <TextField id="name" label="Name" type="text" required />
            <TextField
              id="email"
              label="Email"
              type="email"
              required
              placeholder="you@example.com"
            />
            <TextField
              id="phone"
              label="Phone"
              note="(optional, for SMS)"
              type="tel"
              placeholder="+1 555 123 4567"
              hint="U.S. numbers only at launch. Required only if you want the SMS digest."
            />
          </div>

          <Divider />

          <SectionLabel>What do you want to read about?</SectionLabel>
          <SectionHint>Pick any. You can change these later.</SectionHint>
          <ChoiceChips
            name="pillars"
            options={PILLARS.map((p) => ({ value: p.slug, label: p.name }))}
            selected={pillars}
            onToggle={togglePillar}
          />

          <Divider />

          <SectionLabel>How should we reach you?</SectionLabel>

          <div className="mt-6 space-y-4">
            <ConsentCheckbox name="consent_email">
              I consent to receive marketing and editorial emails from
              Guide Kin (operated by Yelow Sp. z o.o.). Frequency
              varies, typically one email per week. I can unsubscribe
              any time.
            </ConsentCheckbox>

            <ConsentCheckbox name="consent_sms">
              I give my express consent to receive recurring automated
              marketing notification texts to the phone number from
              Guide Kin. Message and data rates may apply. Msg
              frequency varies. I understand I can opt-out by replying
              &apos;STOP&apos; to any message, or get more info by
              replying &apos;HELP.&apos; Consent is not required for
              purchasing products or services. My number will not be
              shared with third parties or affiliates. View our{" "}
              <Link href="/terms" className="text-amber hover:text-sage">
                Terms of Services
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-amber hover:text-sage"
              >
                Privacy Policy
              </Link>
              .
            </ConsentCheckbox>
          </div>

          <div
            style={{
              borderTop: "1px solid #D3D1C7",
              marginTop: "1.5rem",
              paddingTop: "1rem",
            }}
          >
            <button
              type="button"
              onClick={() => setSmsOpen(!smsOpen)}
              className="text-ink/80 hover:text-sage flex cursor-pointer items-center gap-2 text-sm"
              aria-expanded={smsOpen}
            >
              <span
                className={`inline-block transition-transform ${smsOpen ? "rotate-90" : ""}`}
              >
                ▸
              </span>
              SMS messaging & data policy
            </button>
            {smsOpen && (
              <p className="text-ink/70 mt-3 text-xs leading-relaxed">
                SMS is currently available in the United States only.
                By providing your phone number, checking the SMS
                consent box, and clicking the sign-up button, you
                agree to receive periodic text messages from Guide
                Kin — operated by Yelow Sp. z o.o. — at the number
                you submitted. These may include automated messages
                sent using an automatic telephone dialing system.
                Message and data rates may apply. Message frequency
                varies, typically one message per week. Messages will
                consist of weekly content digests, occasional content
                alerts, and account notifications. Consent to receive
                SMS is not a condition of subscribing to Guide Kin or
                accessing any of our content. Text HELP for help.
                Reply STOP at any time to unsubscribe — you&apos;ll
                get one confirmation message and then no further
                texts. See our{" "}
                <Link href="/terms" className="text-amber hover:text-sage">
                  SMS Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-amber hover:text-sage">
                  Privacy Policy
                </Link>{" "}
                for full details.
              </p>
            )}
          </div>

          {submit.status === "error" && <FormError message={submit.message} />}

          <SubmitButton
            submitting={submit.status === "submitting"}
            label="Join the list"
            busyLabel="Joining..."
          />

          <p className="text-ink/60 mt-4 text-center text-xs leading-relaxed">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-amber hover:text-sage">
              SMS Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-amber hover:text-sage">
              Privacy Policy
            </Link>
            . Guide Kin is operated by Yelow Sp. z o.o. We won&apos;t
            sell your data.
          </p>
        </SubscribeFormCard>

        <section className="bg-mist border-y border-stone">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              How we treat your inbox and your data
            </p>
            <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
              {[
                {
                  title: "Free, always",
                  body:
                    "We pay through advertising — only from companies we'd actually recommend.",
                },
                {
                  title: "Yours, not ours",
                  body:
                    "We don't sell your data. Your reading habits stay with us.",
                },
                {
                  title: "One tap to leave",
                  body:
                    "Every email and SMS has a one-tap unsubscribe. No friction, no guilt.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="text-ink font-serif text-lg font-medium">
                    {item.title}
                  </h3>
                  <p className="text-ink/75 mt-2 text-sm leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
