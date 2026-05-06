"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: "sending" });

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });

    if (error) {
      setState({
        kind: "error",
        message: error.message || "Couldn't send the sign-in email. Try again.",
      });
      return;
    }

    setState({ kind: "sent" });
  };

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
          Sign in to the editor.
        </h1>
        <p className="text-ink/70 mt-3 text-sm">
          Enter your email and we&apos;ll send you a sign-in link. No password
          to remember.
        </p>

        {state.kind === "sent" ? (
          <div className="bg-mist border-sage/30 mt-8 rounded-xl border p-5">
            <p className="text-sage text-sm font-medium">Check your inbox</p>
            <p className="text-ink/80 mt-2 text-sm leading-relaxed">
              We sent a sign-in link to <strong>{email}</strong>. The link
              works for one hour. If you don&apos;t see it, check spam.
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
                disabled={state.kind === "sending"}
                className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-2 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none disabled:opacity-60"
              />
            </div>

            {state.kind === "error" && (
              <div className="bg-mist border-amber/40 rounded-xl border p-4 text-sm text-ink">
                {state.message}
              </div>
            )}

            <button
              type="submit"
              disabled={state.kind === "sending"}
              className="bg-sage w-full cursor-pointer rounded-full px-6 py-3 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.kind === "sending" ? "Sending..." : "Send sign-in link"}
            </button>
          </form>
        )}

        <p className="text-ink/60 mt-8 text-center text-xs">
          Only Guide Kin editors can sign in.
        </p>
      </div>
    </main>
  );
}