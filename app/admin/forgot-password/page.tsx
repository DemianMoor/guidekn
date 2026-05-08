"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin/reset-password`,
      }
    );

    if (error) {
      setState({
        kind: "error",
        message: error.message || "Couldn't send the reset email.",
      });
      return;
    }

    setState({ kind: "sent" });
  }

  const submitting = state.kind === "submitting";

  return (
    <main className="bg-cream flex min-h-screen items-center justify-center px-6 py-20">
      <div className="bg-white border-stone w-full max-w-md rounded-2xl border p-8 shadow-sm md:p-10">
        <Link
          href="/"
          className="text-sage text-xl font-medium tracking-tight"
        >
          Guide Kin
        </Link>

        <h1 className="text-ink mt-8 font-serif text-3xl font-medium leading-tight tracking-tight">
          Reset your password.
        </h1>
        <p className="text-ink/70 mt-3 text-sm">
          Enter the email tied to your editor account and we&apos;ll send a
          link to set a new password. Use this the first time too — it&apos;s
          how you set your initial password.
        </p>

        {state.kind === "sent" ? (
          <div className="bg-mist border-sage/30 mt-8 rounded-xl border p-5">
            <p className="text-sage text-sm font-medium">Check your inbox</p>
            <p className="text-ink/80 mt-2 text-sm leading-relaxed">
              If <strong>{email}</strong> is an editor on Guide Kin, a reset
              link is on its way. The link works for one hour.
            </p>
            <p className="text-ink/60 mt-3 text-xs">
              Don&apos;t see it? Check spam, or try again in a minute.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-ink block text-sm font-medium"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                disabled={submitting}
                autoComplete="email"
                className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-2 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none disabled:opacity-60"
              />
            </div>

            {state.kind === "error" && (
              <div
                className="bg-mist border-amber/40 rounded-xl border p-4 text-sm text-ink"
                role="alert"
              >
                {state.message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-sage w-full cursor-pointer rounded-full px-6 py-3 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="border-stone mt-6 border-t pt-6 text-center">
          <Link
            href="/admin/signin"
            className="text-ink/60 hover:text-sage text-xs"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
