"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type State =
  | { kind: "checking" }
  | { kind: "ready" }
  | { kind: "no-session" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<State>({ kind: "checking" });

  // The /auth/callback route should have exchanged the recovery code for a
  // session before redirecting here. If there's no session, the link was bad
  // or expired — show that.
  useEffect(() => {
    let cancelled = false;
    async function check() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setState({ kind: data.session ? "ready" : "no-session" });
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setState({
        kind: "error",
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
      return;
    }
    if (password !== confirm) {
      setState({ kind: "error", message: "Passwords don't match." });
      return;
    }

    setState({ kind: "submitting" });

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setState({
        kind: "error",
        message: error.message || "Couldn't update password.",
      });
      return;
    }

    router.push("/admin");
    router.refresh();
  }

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
          Set a new password.
        </h1>

        {state.kind === "checking" && (
          <p className="text-ink/60 mt-6 text-sm">Checking your link...</p>
        )}

        {state.kind === "no-session" && (
          <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-5">
            <p className="text-ink text-sm font-medium">Link expired</p>
            <p className="text-ink/80 mt-2 text-sm leading-relaxed">
              This reset link is no longer valid. Reset links work for one
              hour and only once.
            </p>
            <Link
              href="/admin/forgot-password"
              className="text-amber hover:text-sage mt-4 inline-block text-sm"
            >
              Request a new link →
            </Link>
          </div>
        )}

        {(state.kind === "ready" ||
          state.kind === "submitting" ||
          state.kind === "error") && (
          <>
            <p className="text-ink/70 mt-3 text-sm">
              Pick something you can remember. At least{" "}
              {MIN_PASSWORD_LENGTH} characters.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="text-ink block text-sm font-medium"
                >
                  New password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  disabled={state.kind === "submitting"}
                  autoComplete="new-password"
                  className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-2 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="text-ink block text-sm font-medium"
                >
                  Confirm password
                </label>
                <input
                  type="password"
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  disabled={state.kind === "submitting"}
                  autoComplete="new-password"
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
                disabled={state.kind === "submitting"}
                className="bg-sage w-full cursor-pointer rounded-full px-6 py-3 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.kind === "submitting"
                  ? "Updating..."
                  : "Set password and sign in"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
