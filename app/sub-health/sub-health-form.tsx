"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import { COVERAGE_INTERESTS, CURRENT_SUB_HEALTH_CONSENT } from "@/lib/consent/sub-health";
import { TRUSTEDFORM_FIELD } from "@/lib/trustedform";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

const consent = CURRENT_SUB_HEALTH_CONSENT;
const tf = (role: string) => ({ "data-tf-element-role": role });

/** SMS consent text with the advertiser name tagged and the partners phrase linked. */
function SmsConsentText() {
  const { sms, smsAdvertiserName, smsPartnersLinkText } = consent;
  const [beforeName, afterName] = sms.split(smsAdvertiserName, 2);
  const [beforeLink, afterLink] = afterName.split(smsPartnersLinkText, 2);
  return (
    <>
      {beforeName}
      <span {...tf("consent-advertiser-name")}>{smsAdvertiserName}</span>
      {beforeLink}
      <Link href="/partners" target="_blank" className="text-amber hover:text-sage">
        {smsPartnersLinkText}
      </Link>
      {afterLink}
    </>
  );
}

/** Sits directly on the footer: -mb-20 cancels SiteFooter's mt-20 gap. */
function Disclaimer() {
  return (
    <section className="bg-cream border-t border-stone -mb-20">
      <p className="text-ink/60 mx-auto max-w-2xl px-6 py-8 text-center text-xs leading-relaxed">
        GuideKin is not affiliated with or endorsed by the U.S. government or
        the federal Medicare program.
      </p>
    </section>
  );
}

/** Gzipped JSON when the browser supports it; plain JSON otherwise (the server gzips). */
async function encodeRecording(events: unknown[]): Promise<Blob> {
  const json = new Blob([JSON.stringify(events)], { type: "application/json" });
  if (typeof CompressionStream === "undefined") return json;
  return new Response(json.stream().pipeThrough(new CompressionStream("gzip"))).blob();
}

export function SubHealthForm() {
  const [interests, setInterests] = useState<string[]>([]);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const events = useRef<unknown[]>([]);
  const stopRecording = useRef<(() => void) | undefined>(undefined);
  const landing = useRef({ pageUrl: "", referrer: "" });

  // Session recording (rrweb): starts on load, stops after a successful submit.
  // Every typed value is masked; checkbox states are recorded.
  useEffect(() => {
    landing.current = { pageUrl: window.location.href, referrer: document.referrer };
    let cancelled = false;
    import("rrweb").then(({ record }) => {
      if (cancelled) return;
      stopRecording.current = record({
        emit: (event) => {
          events.current.push(event);
        },
        maskAllInputs: true,
        sampling: { mousemove: 50, scroll: 150, input: "last" },
      });
    });
    return () => {
      cancelled = true;
      stopRecording.current?.();
    };
  }, []);

  const toggleInterest = (value: string) => {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phone = String(formData.get("phone") ?? "").trim();
    const consentEmail = formData.get("consent_email") === "on";
    const consentSms = formData.get("consent_sms") === "on";

    if (interests.length === 0) {
      setSubmit({ status: "error", message: "Please choose at least one type of coverage." });
      return;
    }
    if (!consentEmail && !consentSms) {
      setSubmit({ status: "error", message: "Please consent to email or SMS so we know how to reach you." });
      return;
    }
    if (consentSms && !phone) {
      setSubmit({ status: "error", message: "Please add your phone number if you'd like to get texts." });
      return;
    }

    setSubmit({ status: "submitting" });

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: phone || null,
      zip: String(formData.get("zip") ?? "").trim(),
      interests,
      consent_email: consentEmail,
      consent_sms: consentSms,
      consent_version: consent.id,
      page_url: landing.current.pageUrl,
      referrer: landing.current.referrer,
      trustedform_cert_url: formData.get(TRUSTEDFORM_FIELD) || null,
    };

    const body = new FormData();
    body.append("payload", JSON.stringify(payload));
    body.append("recording", await encodeRecording([...events.current]), "recording");

    try {
      const res = await fetch("/api/sub-health", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setSubmit({
          status: "error",
          message: data.error || "Something went wrong. Please try again.",
        });
        return;
      }

      stopRecording.current?.();
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
      <SubscribeThankYou
        eyebrow="You're in"
        title="Thanks, we have your details."
        footerExtra={<Disclaimer />}
      >
        We&apos;ll be in touch with Medicare and ACA plan information through
        the channels you chose.
      </SubscribeThankYou>
    );
  }

  return (
    <>
      <SiteHeader />

      <main>
        <SubscribeHero eyebrow="Health coverage" title="Find The Right Health Coverage Plan with GuideKin">
          Leave your details below and we will reach out with the best offer
          based on your location. Notifications are fully free, and you can
          opt out anytime.
        </SubscribeHero>

        <SubscribeFormCard onSubmit={handleSubmit} containerProps={tf("offer")}>
          <SectionLabel>Share Your Info</SectionLabel>

          <div className="mt-6 space-y-5">
            <TextField id="name" label="Full Name" type="text" autoComplete="name" required />
            <TextField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
            <TextField
              id="phone"
              label="Phone"
              note="(optional, for texts)"
              type="tel"
              autoComplete="tel"
              placeholder="+1 555 123 4567"
              hint="U.S. numbers only. Required only if you want texts."
            />
            <TextField
              id="zip"
              label="ZIP code"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              pattern="[0-9]{5}"
              maxLength={5}
              title="5-digit ZIP code"
              required
              placeholder="12345"
            />
          </div>

          <Divider />

          <SectionLabel>Which coverage are you interested in?</SectionLabel>
          <SectionHint>Pick one or more.</SectionHint>
          <ChoiceChips
            name="interests"
            options={[...COVERAGE_INTERESTS]}
            selected={interests}
            onToggle={toggleInterest}
            gridClassName="grid-cols-1 sm:grid-cols-3"
          />

          <Divider />

          <SectionLabel>How should we reach you?</SectionLabel>

          <div className="mt-6 space-y-4">
            <ConsentCheckbox name="consent_email">{consent.email}</ConsentCheckbox>

            <ConsentCheckbox
              name="consent_sms"
              labelProps={tf("consent-language")}
              inputProps={tf("consent-opt-in")}
            >
              <SmsConsentText />
            </ConsentCheckbox>
          </div>

          {submit.status === "error" && <FormError message={submit.message} />}

          <SubmitButton
            submitting={submit.status === "submitting"}
            label="Get plan information"
            busyLabel="Sending..."
            {...tf("submit")}
          />

          <p className="text-ink/60 mt-4 text-center text-xs leading-relaxed">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-amber hover:text-sage">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-amber hover:text-sage">
              Privacy Policy
            </Link>
            . Guide Kin is operated by Yelow Sp. z o.o.
          </p>
        </SubscribeFormCard>
      </main>

      <Disclaimer />
      <SiteFooter />
    </>
  );
}
