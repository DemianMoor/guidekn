"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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

  const dividerStyle: React.CSSProperties = {
    borderTop: "1px solid #D3D1C7",
    marginTop: "2rem",
    marginBottom: "2rem",
  };

  if (submit.status === "success") {
    return (
      <>
        <SiteHeader />
        <main>
          <section className="bg-cream border-b border-stone">
            <div className="mx-auto max-w-2xl px-6 py-24 text-center md:py-32">
              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                You&apos;re in
              </p>
              <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
                Welcome to your kin.
              </h1>
              <p className="text-ink/75 mx-auto mt-6 max-w-xl leading-relaxed">
                We&apos;ve got you on the list. The first thing you&apos;ll
                hear from us is a short welcome email — keep an eye on your
                inbox over the next few minutes. After that, expect one
                quiet email a week.
              </p>
              <div className="mt-10">
                <Link
                  href="/"
                  className="bg-sage inline-block rounded-full px-7 py-3 text-sm text-white hover:opacity-90"
                >
                  Back to Guide Kin
                </Link>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-3xl px-6 py-12 text-center md:py-16">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              Subscribe
            </p>
            <h1 className="text-ink mt-4 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
              Join your kin.
            </h1>
            <p className="text-ink/75 mx-auto mt-4 max-w-xl leading-relaxed">
              Pick what you want to hear about, and how. Free, always. No
              spam, no selling your data, unsubscribe in one tap.
            </p>
          </div>
        </section>

        <section className="bg-cream">
          <div className="mx-auto max-w-2xl px-6 py-10 md:py-14">
            <form
              onSubmit={handleSubmit}
              className="bg-white border-stone rounded-2xl border p-6 shadow-sm md:p-10"
            >
              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                Who you are
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="name" className="text-ink block text-sm font-medium">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-2 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="text-ink block text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-2 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="text-ink block text-sm font-medium">
                    Phone <span className="text-ink/50 font-normal">(optional, for SMS)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+1 555 123 4567"
                    className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-2 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none"
                  />
                  <p className="text-ink/50 mt-2 text-xs">
                    U.S. numbers only at launch. Required only if you want
                    the SMS digest.
                  </p>
                </div>
              </div>

              <div style={dividerStyle} />

              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                What do you want to read about?
              </p>
              <p className="text-ink/60 mt-2 text-xs">
                Pick any. You can change these later.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {PILLARS.map((p) => {
                  const checked = pillars.includes(p.slug);
                  return (
                    <label
                      key={p.slug}
                      className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 transition ${
                        checked
                          ? "border-sage bg-mist"
                          : "border-stone bg-white hover:border-sage/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="pillars"
                        value={p.slug}
                        checked={checked}
                        onChange={() => togglePillar(p.slug)}
                        className="sr-only"
                      />
                      <span className={`text-sm font-medium ${checked ? "text-sage" : "text-ink"}`}>
                        {p.name}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div style={dividerStyle} />

              <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
                How should we reach you?
              </p>

              <div className="mt-6 space-y-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="consent_email"
                    className="accent-sage mt-1 h-4 w-4 flex-shrink-0"
                  />
                  <span className="text-ink/85 text-sm leading-relaxed">
                    I consent to receive marketing and editorial emails from
                    Guide Kin (operated by Yelow Sp. z o.o.). Frequency
                    varies, typically one email per week. I can unsubscribe
                    any time.
                  </span>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="consent_sms"
                    className="accent-sage mt-1 h-4 w-4 flex-shrink-0"
                  />
                  <span className="text-ink/85 text-sm leading-relaxed">
                    I consent to receive marketing and editorial SMS messages
                    from Guide Kin (operated by Yelow Sp. z o.o.) at the
                    phone number I provided above. Frequency varies,
                    typically one message per week.
                  </span>
                </label>
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

              {submit.status === "error" && (
                <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-4 text-sm text-ink">
                  {submit.message}
                </div>
              )}

              <button
                type="submit"
                disabled={submit.status === "submitting"}
                className="bg-sage mt-6 w-full cursor-pointer rounded-full px-6 py-4 text-base text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submit.status === "submitting" ? "Joining..." : "Join the list"}
              </button>

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
            </form>
          </div>
        </section>

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