"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type Mode = "password" | "otp";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setState({
        kind: "error",
        message: error.message || "Couldn't sign in. Check your credentials.",
      });
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });

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
        message: error.message || "Couldn't send the sign-in email.",
      });
      return;
    }

    setState({ kind: "sent" });
  }

  function switchMode(next: Mode) {
    setMode(next);
    setState({ kind: "idle" });
    setPassword("");
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
          Sign in to the editor.
        </h1>
        <p className="text-ink/70 mt-3 text-sm">
          {mode === "password"
            ? "Use your email and password."
            : "Enter your email and we'll send you a sign-in link."}
        </p>

        {state.kind === "sent" ? (
          <div className="bg-mist border-sage/30 mt-8 rounded-xl border p-5">
            <p className="text-sage text-sm font-medium">Check your inbox</p>
            <p className="text-ink/80 mt-2 text-sm leading-relaxed">
              We sent a sign-in link to <strong>{email}</strong>. The link
              works for one hour.
            </p>
          </div>
        ) : mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-4">
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

            <div>
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor="password"
                  className="text-ink block text-sm font-medium"
                >
                  Password
                </label>
                <Link
                  href="/admin/forgot-password"
                  className="text-amber hover:text-sage text-xs"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                autoComplete="current-password"
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
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email-otp"
                className="text-ink block text-sm font-medium"
              >
                Email
              </label>
              <input
                type="email"
                id="email-otp"
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
              {submitting ? "Sending..." : "Send sign-in link"}
            </button>
          </form>
        )}

        {state.kind !== "sent" && (
          <div className="border-stone mt-6 border-t pt-6 text-center">
            {mode === "password" ? (
              <button
                type="button"
                onClick={() => switchMode("otp")}
                className="text-ink/60 hover:text-sage cursor-pointer text-xs"
              >
                Email me a sign-in link instead
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode("password")}
                className="text-ink/60 hover:text-sage cursor-pointer text-xs"
              >
                Sign in with password instead
              </button>
            )}
          </div>
        )}

        <p className="text-ink/60 mt-8 text-center text-xs">
          Only Guide Kin editors can sign in.
        </p>
      </div>
    </main>
  );
}
