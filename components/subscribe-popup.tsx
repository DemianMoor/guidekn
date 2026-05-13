"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePopupContext } from "@/lib/popup-context";

const SESSION_SHOWN_KEY = "gk_popup_shown_this_session";
const SUBSCRIBED_KEY = "gk_subscribed";
const TIMER_DELAY_MS = 5000;

const EXCLUDED_PATH_PREFIXES = ["/admin", "/auth", "/api"];
const EXCLUDED_EXACT_PATHS = ["/subscribe"];

function isExcludedPath(pathname: string): boolean {
  if (EXCLUDED_EXACT_PATHS.includes(pathname)) return true;
  return EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function SubscribePopup() {
  const pathname = usePathname();
  const { isSuppressed } = usePopupContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentSms, setConsentSms] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isExcludedPath(pathname)) return;
    if (isSuppressed) return;
    if (sessionStorage.getItem(SESSION_SHOWN_KEY) === "1") return;
    if (localStorage.getItem(SUBSCRIBED_KEY) === "1") return;

    function startTimer() {
      if (timerRef.current) return;
      startedAtRef.current = Date.now();
      const remaining = TIMER_DELAY_MS - elapsedRef.current;
      timerRef.current = setTimeout(() => {
        sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
        setIsOpen(true);
      }, Math.max(0, remaining));
    }

    function pauseTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        if (startedAtRef.current) {
          elapsedRef.current += Date.now() - startedAtRef.current;
          startedAtRef.current = null;
        }
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        pauseTimer();
      } else {
        startTimer();
      }
    }

    if (!document.hidden) {
      startTimer();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      pauseTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, isSuppressed]);

  useEffect(() => {
    if (!isOpen) return;

    firstInputRef.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  function handleClose() {
    setIsOpen(false);
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) handleClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!consentEmail && !consentSms) {
      setError("Please consent to email or SMS so we know how to reach you.");
      return;
    }
    const trimmedPhone = phone.trim();
    if (consentSms && !trimmedPhone) {
      setError("Please add your phone number if you'd like the SMS digest.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        email: email.trim(),
        consent_email: consentEmail,
        consent_sms: consentSms,
        source: "popup",
      };
      if (trimmedPhone) {
        // API stores phone as a single string — concatenate so country
        // code is preserved alongside the number.
        payload.phone = `${countryCode} ${trimmedPhone}`;
      }

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Subscribe failed (${res.status})`);
      }

      setSuccess(true);
      localStorage.setItem(SUBSCRIBED_KEY, "1");

      setTimeout(() => setIsOpen(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-popup-title"
    >
      <div
        onClick={handleBackdropClick}
        className="flex min-h-full items-center justify-center px-4 py-6 sm:py-10"
      >
      <div
        ref={dialogRef}
        className="bg-cream relative w-full max-w-xl rounded-2xl p-6 shadow-2xl sm:p-8 md:p-10"
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          className="text-ink/50 hover:text-ink absolute right-4 top-4 text-2xl leading-none"
        >
          ×
        </button>

        {success ? (
          <div className="py-6 text-center">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              You&apos;re in
            </p>
            <h2
              id="subscribe-popup-title"
              className="text-ink mt-3 font-serif text-2xl font-medium leading-tight tracking-tight"
            >
              Welcome to your kin.
            </h2>
            <p className="text-ink/70 mt-4 text-sm">
              Look out for a quiet email each Sunday morning.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              The weekly
            </p>
            <h2
              id="subscribe-popup-title"
              className="text-ink mt-3 font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl"
            >
              One quiet email a week, written for your kin.
            </h2>
            <p className="text-ink/70 mt-3 text-sm leading-relaxed">
              A short, useful read every Sunday morning. Free, always.
              Unsubscribe in one tap.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="popup-email"
                  className="text-ink/70 mb-1 block text-xs font-medium uppercase tracking-wide"
                >
                  Email
                </label>
                <input
                  ref={firstInputRef}
                  id="popup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-stone focus:border-sage focus:ring-sage/30 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="popup-phone"
                  className="text-ink/70 mb-1 block text-xs font-medium uppercase tracking-wide"
                >
                  Phone <span className="text-ink/40 normal-case">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled
                    className="border-stone w-24 cursor-not-allowed rounded-md border bg-white px-2 py-2 text-sm text-ink/70 focus:outline-none"
                    aria-label="Country code"
                  >
                    <option value="+1">+1</option>
                  </select>
                  <input
                    id="popup-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-stone focus:border-sage focus:ring-sage/30 flex-1 rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    placeholder="555 123 4567"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consentEmail}
                    onChange={(e) => setConsentEmail(e.target.checked)}
                    className="accent-sage mt-1 h-4 w-4 flex-shrink-0"
                  />
                  <span className="text-ink/85 text-xs leading-relaxed">
                    I consent to receive marketing and editorial emails from
                    Guide Kin (operated by Yelow Sp. z o.o.). Frequency varies,
                    typically one email per week. I can unsubscribe any time.
                  </span>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consentSms}
                    onChange={(e) => setConsentSms(e.target.checked)}
                    className="accent-sage mt-1 h-4 w-4 flex-shrink-0"
                  />
                  <span className="text-ink/85 text-xs leading-relaxed">
                    By providing your phone number and checking this box, you
                    are consenting to receive marketing text messages to that
                    number from Guide Kin. Message frequency varies. Message
                    and data rates may apply. Text HELP for help. Text STOP to
                    unsubscribe. SMS opt-in data will not be shared or sold
                    with 3rd parties.
                  </span>
                </label>
              </div>

              <div className="border-stone border-t pt-3">
                <button
                  type="button"
                  onClick={() => setSmsOpen(!smsOpen)}
                  className="text-ink/80 hover:text-sage flex cursor-pointer items-center gap-2 text-xs"
                  aria-expanded={smsOpen}
                >
                  <span
                    className={`inline-block transition-transform ${smsOpen ? "rotate-90" : ""}`}
                  >
                    ▸
                  </span>
                  SMS messaging &amp; data policy
                </button>
                {smsOpen && (
                  <p className="text-ink/70 mt-3 text-xs leading-relaxed">
                    SMS is currently available in the United States only. By
                    providing your phone number, checking the SMS consent box,
                    and clicking the sign-up button, you agree to receive
                    periodic text messages from Guide Kin — operated by Yelow
                    Sp. z o.o. — at the number you submitted. These may
                    include automated messages sent using an automatic
                    telephone dialing system. Message and data rates may
                    apply. Message frequency varies, typically one message per
                    week. Messages will consist of weekly content digests,
                    occasional content alerts, and account notifications.
                    Consent to receive SMS is not a condition of subscribing
                    to Guide Kin or accessing any of our content. Text HELP
                    for help. Reply STOP at any time to unsubscribe —
                    you&apos;ll get one confirmation message and then no
                    further texts. See our{" "}
                    <Link href="/terms" className="text-amber hover:text-sage">
                      SMS Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-amber hover:text-sage"
                    >
                      Privacy Policy
                    </Link>{" "}
                    for full details.
                  </p>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-700" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-sage w-full rounded-full px-6 py-3 text-sm text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Joining..." : "Join your kin"}
              </button>

              <p className="text-ink/60 text-center text-xs leading-relaxed">
                By signing up you agree to our{" "}
                <Link href="/terms" className="text-amber hover:text-sage">
                  SMS Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-amber hover:text-sage">
                  Privacy Policy
                </Link>
                . Guide Kin is operated by Yelow Sp. z o.o. We won&apos;t sell
                your data.
              </p>
            </form>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
