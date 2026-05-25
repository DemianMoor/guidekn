"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DEADLINE_OPTIONS: { label: string; hours: number | null }[] = [
  { label: "Permanent (until changed)", hours: null },
  { label: "1 hour", hours: 1 },
  { label: "2 hours", hours: 2 },
  { label: "3 hours", hours: 3 },
  { label: "4 hours", hours: 4 },
  { label: "5 hours", hours: 5 },
  { label: "6 hours", hours: 6 },
  { label: "12 hours", hours: 12 },
  { label: "24 hours", hours: 24 },
  { label: "48 hours", hours: 48 },
  { label: "72 hours", hours: 72 },
  { label: "7 days", hours: 168 },
];

type Preflight = { headerFound: boolean; footerFound: boolean } | null;
type Banner = { kind: "ok" | "err" | "warn"; text: string } | null;

export default function ChromeSettings({
  slug,
  effective,
  pendingRevertAtIso,
  pendingRevertTo,
}: {
  slug: string;
  effective: boolean;
  pendingRevertAtIso: string | null;
  pendingRevertTo: boolean | null;
}) {
  const router = useRouter();
  const [toggle, setToggle] = useState(effective);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [preflight, setPreflight] = useState<Preflight>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [remaining, setRemaining] = useState<string | null>(
    formatRemaining(pendingRevertAtIso)
  );

  // Live-update the countdown every 30 seconds so the editor doesn't have to refresh.
  useEffect(() => {
    if (!pendingRevertAtIso) {
      setRemaining(null);
      return;
    }
    setRemaining(formatRemaining(pendingRevertAtIso));
    const id = setInterval(() => {
      setRemaining(formatRemaining(pendingRevertAtIso));
    }, 30_000);
    return () => clearInterval(id);
  }, [pendingRevertAtIso]);

  // Keep the toggle in sync if the server state changes underneath us.
  useEffect(() => {
    setToggle(effective);
  }, [effective]);

  const dirty = toggle !== effective || deadline !== null;
  const isScheduling = pendingRevertAtIso !== null;

  async function handleSave() {
    setBusy(true);
    setBanner(null);
    setPreflight(null);
    try {
      // Preflight check ONLY when turning the swap on — the warning is
      // about whether we'll find partner chrome to strip.
      if (toggle) {
        const res = await fetch(
          `/api/admin/landing-pages/${slug}/chrome-check`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as Preflight | { error: string };
        if (res.ok && data && "headerFound" in data) {
          setPreflight(data);
        } else if ("error" in (data ?? {})) {
          setBanner({
            kind: "warn",
            text: `Couldn't preflight: ${(data as { error: string }).error}. Saving anyway.`,
          });
        }
      }

      const res = await fetch(`/api/admin/landing-pages/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_site_chrome: toggle,
          deadline_hours: deadline,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBanner({ kind: "err", text: data.error || "Save failed." });
        return;
      }

      const messageParts = [
        `Saved. Site chrome is now ${toggle ? "ON" : "OFF"}.`,
      ];
      if (deadline) {
        messageParts.push(
          `Will revert in ${formatHours(deadline)} to ${toggle ? "OFF" : "ON"}.`
        );
      }
      setBanner({ kind: "ok", text: messageParts.join(" ") });
      setDeadline(null);
      router.refresh();
    } catch (err) {
      setBanner({
        kind: "err",
        text: err instanceof Error ? err.message : "Save failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelRevert() {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/landing-pages/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel_revert: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBanner({ kind: "err", text: data.error || "Failed to cancel." });
        return;
      }
      setBanner({ kind: "ok", text: "Pending revert cancelled." });
      router.refresh();
    } catch (err) {
      setBanner({
        kind: "err",
        text: err instanceof Error ? err.message : "Failed to cancel.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-stone rounded-lg bg-white p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-ink font-serif text-lg">Site chrome</h2>
          <p className="text-ink/60 text-xs mt-1">
            When on, the page is served with Guide Kin&apos;s header and footer
            instead of the partner&apos;s. Partner header/footer is removed
            best-effort.
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="text-ink/50 uppercase tracking-wide">Now serving</p>
          <p
            className={`mt-1 font-medium ${
              effective ? "text-sage" : "text-ink"
            }`}
          >
            {effective ? "Guide Kin chrome" : "Partner chrome"}
          </p>
          {isScheduling && (
            <p className="text-ink/60 mt-1">
              Reverts to {pendingRevertTo ? "ON" : "OFF"}
              {remaining ? ` in ${remaining}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-end">
        <label className="flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={toggle}
            onChange={(e) => setToggle(e.target.checked)}
            disabled={busy}
            className="h-4 w-4"
          />
          <span className="text-sm text-ink">
            Use Guide Kin header &amp; footer
          </span>
        </label>

        <div>
          <label className="text-ink/60 text-xs uppercase tracking-wide block mb-1">
            Auto-revert after
          </label>
          <select
            value={deadline === null ? "" : String(deadline)}
            onChange={(e) =>
              setDeadline(e.target.value === "" ? null : Number(e.target.value))
            }
            disabled={busy}
            className="bg-white border border-stone rounded-md px-3 py-2 text-sm w-full"
          >
            {DEADLINE_OPTIONS.map((opt) => (
              <option
                key={opt.label}
                value={opt.hours === null ? "" : String(opt.hours)}
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !dirty}
          className="bg-sage text-cream px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? "Saving..." : "Save"}
        </button>
      </div>

      {isScheduling && (
        <div className="mt-3">
          <button
            type="button"
            onClick={handleCancelRevert}
            disabled={busy}
            className="text-xs text-red-700 hover:text-red-900 disabled:opacity-50"
          >
            Cancel pending revert
          </button>
        </div>
      )}

      {preflight && (
        <div className="mt-3 text-xs space-y-1">
          <p
            className={preflight.headerFound ? "text-sage" : "text-amber"}
            role={preflight.headerFound ? undefined : "alert"}
          >
            {preflight.headerFound
              ? "✓ Partner header detected — it will be removed."
              : "⚠ Partner header not detected — Guide Kin header will still be added on top, but the partner's own header may remain. Check the live page."}
          </p>
          <p
            className={preflight.footerFound ? "text-sage" : "text-amber"}
            role={preflight.footerFound ? undefined : "alert"}
          >
            {preflight.footerFound
              ? "✓ Partner footer detected — it will be removed."
              : "⚠ Partner footer not detected — Guide Kin footer will still be added, but the partner's own footer may remain. Check the live page."}
          </p>
        </div>
      )}

      {banner && (
        <div
          role="alert"
          className={`mt-3 rounded-md border p-3 text-sm ${
            banner.kind === "ok"
              ? "bg-mist border-sage/40 text-sage"
              : banner.kind === "warn"
              ? "bg-amber/10 border-amber/40 text-ink"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {banner.text}
        </div>
      )}
    </section>
  );
}

function formatRemaining(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  return formatDurationMs(ms);
}

function formatDurationMs(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatHours(h: number): string {
  if (h >= 24 && h % 24 === 0) {
    const d = h / 24;
    return `${d} day${d === 1 ? "" : "s"}`;
  }
  return `${h} hour${h === 1 ? "" : "s"}`;
}
