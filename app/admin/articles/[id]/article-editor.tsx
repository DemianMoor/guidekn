"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Convert ISO string to the format datetime-local input expects
function toLocalDatetimeInput(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const PILLARS = [
  { slug: "body", name: "Body" },
  { slug: "mind", name: "Mind" },
  { slug: "glow", name: "Glow" },
  { slug: "roam", name: "Roam" },
  { slug: "bonds", name: "Bonds" },
  { slug: "years", name: "Years" },
];

type Article = {
  id: string;
  title: string;
  slug: string;
  pillar: string;
  dek: string | null;
  body: string;
  byline: string;
  image_url: string | null;
  image_alt: string | null;
  image_credit: string | null;
  status: "draft" | "scheduled" | "published" | "archived";
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string };

export function ArticleEditor({ article: initial }: { article: Article }) {
  const router = useRouter();

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [dek, setDek] = useState(initial.dek ?? "");
  const [body, setBody] = useState(initial.body);
  const [byline, setByline] = useState(initial.byline);
  const [pillar, setPillar] = useState(initial.pillar);
  const [imageUrl, setImageUrl] = useState(initial.image_url ?? "");
  const [imageAlt, setImageAlt] = useState(initial.image_alt ?? "");
  const [imageCredit, setImageCredit] = useState(initial.image_credit ?? "");
  const [customDate, setCustomDate] = useState(
    initial.published_at ? toLocalDatetimeInput(initial.published_at) : ""
  );

  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [status, setStatus] = useState(initial.status);
  const [publishedAt, setPublishedAt] = useState<string | null>(initial.published_at);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const initialJSON = useRef(
    JSON.stringify({
      title: initial.title,
      slug: initial.slug,
      dek: initial.dek ?? "",
      body: initial.body,
      byline: initial.byline,
      pillar: initial.pillar,
      image_url: initial.image_url ?? "",
      image_alt: initial.image_alt ?? "",
      image_credit: initial.image_credit ?? "",
      published_at: initial.published_at,
    })
  );

  const currentJSON = JSON.stringify({
    title,
    slug,
    dek,
    body,
    byline,
    pillar,
    image_url: imageUrl,
    image_alt: imageAlt,
    image_credit: imageCredit,
    published_at: customDate ? new Date(customDate).toISOString() : null,
  });

  const hasChanges = currentJSON !== initialJSON.current;

  useEffect(() => {
    if (!hasChanges) return;
    const timer = setTimeout(async () => {
      await save({ silent: true });
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentJSON]);

  async function save(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setSaveState({ kind: "saving" });
    else setSaveState({ kind: "saving" });

    try {
      const res = await fetch(`/api/admin/articles/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          dek: dek.trim(),
          body,
          byline: byline.trim(),
          pillar,
          image_url: imageUrl.trim() || null,
          image_alt: imageAlt.trim(),
          image_credit: imageCredit.trim() || null,
          published_at: customDate
            ? new Date(customDate).toISOString()
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveState({
          kind: "error",
          message: data.error || "Couldn't save. Try again.",
        });
        return false;
      }

      initialJSON.current = currentJSON;
      if (data.article?.slug) setSlug(data.article.slug);
      setSaveState({ kind: "saved", at: Date.now() });
      return true;
    } catch {
      setSaveState({
        kind: "error",
        message: "Couldn't reach the server. Check your connection.",
      });
      return false;
    }
  }

  async function changeStatus(newStatus: Article["status"], scheduledFor?: string) {
    const ok = await save({ silent: true });
    if (!ok) return;

    setSaveState({ kind: "saving" });

    const payload: Record<string, unknown> = { status: newStatus };
    if (newStatus === "published" && !scheduledFor) {
      payload.published_at = customDate
        ? new Date(customDate).toISOString()
        : new Date().toISOString();
    } else if (newStatus === "scheduled" && scheduledFor) {
      payload.published_at = scheduledFor;
    } else if (newStatus === "draft" || newStatus === "archived") {
      payload.published_at = null;
    }

    try {
      const res = await fetch(`/api/admin/articles/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveState({
          kind: "error",
          message: data.error || "Couldn't update status.",
        });
        return;
      }

      setStatus(data.article.status);
      setPublishedAt(data.article.published_at);
      if (data.article.published_at) {
        setCustomDate(toLocalDatetimeInput(data.article.published_at));
      } else {
        setCustomDate("");
      }
      setSaveState({ kind: "saved", at: Date.now() });
      setScheduleOpen(false);
      router.refresh();
    } catch {
      setSaveState({
        kind: "error",
        message: "Couldn't reach the server.",
      });
    }
  }

  async function deleteArticle() {
    const res = await fetch(`/api/admin/articles/${initial.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setSaveState({ kind: "error", message: "Couldn't delete." });
      return;
    }
    router.push("/admin/articles");
  }

  const statusStyles: Record<string, string> = {
    draft: "bg-stone/40 text-ink/70",
    scheduled: "bg-amber/20 text-amber",
    published: "bg-mist text-sage",
    archived: "bg-stone text-ink/60",
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 border-stone border-b pb-6">
        <div>
          <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
            Articles /{" "}
            <Link href="/admin/articles" className="hover:text-sage">
              all
            </Link>
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs capitalize ${statusStyles[status]}`}
            >
              {status}
            </span>
            <SaveStateLabel state={saveState} hasChanges={hasChanges} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {status === "draft" && (
            <>
              <button
                onClick={() => setScheduleOpen(!scheduleOpen)}
                className="text-ink hover:border-sage hover:text-sage cursor-pointer rounded-full border border-stone px-4 py-2 text-sm"
              >
                Schedule
              </button>
              <button
                onClick={() => changeStatus("published")}
                className="bg-sage cursor-pointer rounded-full px-5 py-2 text-sm text-white hover:opacity-90"
              >
                Publish now
              </button>
            </>
          )}
          {status === "scheduled" && (
            <>
              <button
                onClick={() => changeStatus("draft")}
                className="text-ink hover:border-sage hover:text-sage cursor-pointer rounded-full border border-stone px-4 py-2 text-sm"
              >
                Move to draft
              </button>
              <button
                onClick={() => changeStatus("published")}
                className="bg-sage cursor-pointer rounded-full px-5 py-2 text-sm text-white hover:opacity-90"
              >
                Publish now
              </button>
            </>
          )}
          {status === "published" && (
            <>
              <Link
                href={`/${pillar}/${slug}`}
                target="_blank"
                rel="noopener"
                className="text-ink hover:border-sage hover:text-sage rounded-full border border-stone px-4 py-2 text-sm"
              >
                View live ↗
              </Link>
              <button
                onClick={() => changeStatus("draft")}
                className="text-ink hover:border-sage hover:text-sage cursor-pointer rounded-full border border-stone px-4 py-2 text-sm"
              >
                Unpublish
              </button>
            </>
          )}
          {status === "archived" && (
            <button
              onClick={() => changeStatus("draft")}
              className="text-ink hover:border-sage hover:text-sage cursor-pointer rounded-full border border-stone px-4 py-2 text-sm"
            >
              Restore to draft
            </button>
          )}
        </div>
      </div>

      {scheduleOpen && (
        <div className="bg-mist border-stone mt-4 rounded-2xl border p-5">
          <p className="text-ink text-sm font-medium">Schedule for later</p>
          <p className="text-ink/60 mt-1 text-xs">
            Pick a date and time. The article will publish automatically.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="border-stone text-ink rounded-xl border bg-white px-4 py-2 text-sm focus:border-sage focus:outline-none"
            />
            <button
              onClick={() => {
                if (!scheduleDate) return;
                changeStatus("scheduled", new Date(scheduleDate).toISOString());
              }}
              disabled={!scheduleDate}
              className="bg-sage cursor-pointer rounded-full px-5 py-2 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Schedule
            </button>
            <button
              onClick={() => setScheduleOpen(false)}
              className="text-ink/70 hover:text-sage cursor-pointer text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {publishedAt && status !== "draft" && (
        <p className="text-ink/60 mt-4 text-xs">
          {status === "scheduled" ? "Scheduled for: " : "Published: "}
          {new Date(publishedAt).toLocaleString()}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="bg-white border-stone rounded-2xl border p-6 md:p-8 lg:col-span-2">
          <label className="block">
            <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              Title
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-ink mt-2 w-full font-serif text-3xl font-medium leading-tight tracking-tight focus:outline-none md:text-4xl"
              placeholder="Article headline"
            />
          </label>

          <label className="mt-6 block">
            <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              Dek (subhead)
            </span>
            <textarea
              value={dek}
              onChange={(e) => setDek(e.target.value)}
              rows={2}
              className="text-ink/85 mt-2 w-full text-lg leading-relaxed focus:outline-none"
              placeholder="One-line summary of the angle..."
            />
          </label>

          <label className="mt-6 block">
            <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              Body (markdown)
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={30}
              className="prose-editorial text-ink/85 border-stone mt-2 w-full rounded-xl border p-4 leading-relaxed focus:border-sage focus:outline-none"
              placeholder="Write the article in markdown..."
            />
            <p className="text-ink/50 mt-2 text-xs">
              Use ## for subheadings, blank lines between paragraphs, *italic*
              and **bold** for emphasis. Markdown renders on the live site.
            </p>
          </label>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-stone rounded-2xl border p-6">
            <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              Metadata
            </p>

            <label className="mt-4 block">
              <span className="text-ink text-xs font-medium">Pillar</span>
              <select
                value={pillar}
                onChange={(e) => setPillar(e.target.value)}
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
              >
                {PILLARS.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-ink text-xs font-medium">Byline</span>
              <input
                type="text"
                value={byline}
                onChange={(e) => setByline(e.target.value)}
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-ink text-xs font-medium">URL slug</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
              />
              <p className="text-ink/60 mt-1 text-xs">
                URL: <code className="text-ink/80">/{pillar}/{slug}</code>
              </p>
              {status === "published" && slug !== initial.slug && (
                <p className="text-amber mt-2 text-xs">
                  Warning: changing the slug breaks links already shared with
                  the old URL.
                </p>
              )}
            </label>

            <label className="mt-4 block">
              <span className="text-ink text-xs font-medium">Publish date</span>
              <input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
              />
              <p className="text-ink/60 mt-1 text-xs">
                Leave blank to use the current time when you click Publish.
                Set a past date to backdate; future dates schedule for later.
              </p>
              {customDate && (
                <button
                  type="button"
                  onClick={() => setCustomDate("")}
                  className="text-amber hover:text-sage mt-2 cursor-pointer text-xs"
                >
                  Clear date
                </button>
              )}
            </label>
          </div>

          <div className="bg-white border-stone rounded-2xl border p-6">
            <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              Hero image
            </p>
            <p className="text-ink/60 mt-1 text-xs">
              Paste any image URL (Unsplash, your CDN, etc.). Leave blank for
              the placeholder layout.
            </p>

            <label className="mt-4 block">
              <span className="text-ink text-xs font-medium">Image URL</span>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-ink text-xs font-medium">
                Alt text / image description
              </span>
              <textarea
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                rows={3}
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-ink text-xs font-medium">
                Image credit (optional)
              </span>
              <input
                type="text"
                value={imageCredit}
                onChange={(e) => setImageCredit(e.target.value)}
                placeholder="Photo: Jane Doe / Unsplash"
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
              />
            </label>

            {imageUrl && (
              <div className="mt-4">
                <p className="text-ink/60 text-xs font-medium">Preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  className="border-stone mt-2 aspect-[4/3] w-full rounded-xl border object-cover"
                />
              </div>
            )}
          </div>

          <div className="bg-white border-stone rounded-2xl border p-6">
            <button
              onClick={() => save()}
              disabled={!hasChanges || saveState.kind === "saving"}
              className="bg-sage w-full cursor-pointer rounded-full px-4 py-2 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveState.kind === "saving" ? "Saving..." : "Save now"}
            </button>
            <p className="text-ink/50 mt-2 text-center text-xs">
              Autosave runs 2 seconds after each edit.
            </p>

            <div className="border-stone mt-6 border-t pt-6">
              <button
                onClick={() => setShowDelete(true)}
                className="text-amber hover:text-sage cursor-pointer w-full text-center text-xs"
              >
                Delete article
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6">
          <div className="bg-white border-stone w-full max-w-md rounded-2xl border p-6 md:p-8">
            <h3 className="text-ink font-serif text-xl font-medium tracking-tight">
              Delete this article?
            </h3>
            <p className="text-ink/70 mt-2 text-sm">
              This is permanent. The article and its slug{" "}
              <code className="text-ink/80">{initial.slug}</code> will be gone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="text-ink hover:border-sage hover:text-sage cursor-pointer rounded-full border border-stone px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={deleteArticle}
                className="bg-amber cursor-pointer rounded-full px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveStateLabel({
  state,
  hasChanges,
}: {
  state: SaveState;
  hasChanges: boolean;
}) {
  if (state.kind === "saving") {
    return <span className="text-ink/60 text-xs">Saving...</span>;
  }
  if (state.kind === "error") {
    return <span className="text-amber text-xs">{state.message}</span>;
  }
  if (state.kind === "saved") {
    return <span className="text-sage text-xs">All changes saved</span>;
  }
  if (hasChanges) {
    return <span className="text-ink/60 text-xs">Unsaved changes</span>;
  }
  return <span className="text-ink/60 text-xs">No changes</span>;
}