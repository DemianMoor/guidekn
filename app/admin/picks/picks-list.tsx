"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PILLARS } from "@/lib/brand-voice";

type PickRow = {
  id: string;
  slug: string;
  category: string;
  title: string;
  dek: string | null;
  status: "draft" | "published";
  pillars: string[];
  published_at: string | null;
  updated_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-stone/40 text-ink/70",
  published: "bg-mist text-sage",
};

type BulkAction = "publish" | "unpublish" | "delete";

export default function PicksList({
  picks,
  page,
  totalPages,
  totalCount,
  pageSize,
}: {
  picks: PickRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyAction, setBusyAction] = useState<BulkAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allOnPageIds = useMemo(() => picks.map((p) => p.id), [picks]);
  const allChecked =
    picks.length > 0 && allOnPageIds.every((id) => selected.has(id));
  const someChecked = !allChecked && allOnPageIds.some((id) => selected.has(id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        for (const id of allOnPageIds) next.delete(id);
      } else {
        for (const id of allOnPageIds) next.add(id);
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function runBulk(action: BulkAction) {
    if (selected.size === 0 || busyAction) return;

    if (action === "delete") {
      const confirmed = confirm(
        `Delete ${selected.size} pick${selected.size === 1 ? "" : "s"}? This cannot be undone. All products inside the selected picks will be deleted too.`
      );
      if (!confirmed) return;
    }

    setBusyAction(action);
    setError(null);
    try {
      const res = await fetch("/api/admin/picks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `${action} failed (${res.status})`);
        return;
      }
      clearSelection();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setBusyAction(null);
    }
  }

  // Pagination link helper
  function pageHref(targetPage: number): string {
    const params = new URLSearchParams(searchParams.toString());
    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (picks.length === 0) {
    return (
      <div className="bg-white border-stone mt-6 rounded-2xl border p-12 text-center">
        <p className="text-ink/70">
          {totalCount === 0
            ? "No picks yet. Click + New pick or Bulk import to get started."
            : "No picks match these filters."}
        </p>
      </div>
    );
  }

  const fromIndex = (page - 1) * pageSize + 1;
  const toIndex = Math.min(page * pageSize, totalCount);

  return (
    <div className="mt-6 space-y-4">
      {/* Bulk action bar — only renders when something is selected */}
      {selected.size > 0 && (
        <div className="bg-mist border-sage/40 sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 shadow-sm">
          <p className="text-ink text-sm">
            <strong>{selected.size}</strong> selected
            <button
              type="button"
              onClick={clearSelection}
              className="text-amber hover:text-sage ml-3 cursor-pointer text-xs"
            >
              Clear
            </button>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runBulk("publish")}
              disabled={!!busyAction}
              className="bg-sage text-cream cursor-pointer rounded-full px-4 py-1.5 text-xs hover:opacity-90 disabled:opacity-60"
            >
              {busyAction === "publish" ? "Publishing..." : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => runBulk("unpublish")}
              disabled={!!busyAction}
              className="text-ink hover:border-sage hover:text-sage cursor-pointer rounded-full border border-stone bg-white px-4 py-1.5 text-xs disabled:opacity-60"
            >
              {busyAction === "unpublish" ? "Unpublishing..." : "Unpublish"}
            </button>
            <button
              type="button"
              onClick={() => runBulk("delete")}
              disabled={!!busyAction}
              className="bg-amber cursor-pointer rounded-full px-4 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-60"
            >
              {busyAction === "delete" ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-mist border-amber/40 rounded-xl border p-3 text-sm text-ink">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border-stone overflow-hidden rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-mist border-stone border-b">
            <tr className="text-ink/70 text-left">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={toggleAll}
                  className="accent-sage cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Pillars</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {picks.map((p) => {
              const checked = selected.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={`border-stone border-b last:border-0 ${
                    checked ? "bg-mist/40" : "hover:bg-cream"
                  }`}
                >
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.title}`}
                      checked={checked}
                      onChange={() => toggleOne(p.id)}
                      className="accent-sage cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/picks/${p.id}/edit`}
                      className="text-ink hover:text-sage block font-medium"
                    >
                      {p.title}
                    </Link>
                    {p.dek && (
                      <p className="text-ink/60 mt-1 text-xs line-clamp-1">
                        {p.dek}
                      </p>
                    )}
                  </td>
                  <td className="text-ink/80 px-4 py-3 align-top text-xs capitalize">
                    {p.category.replace(/-/g, " ")}
                  </td>
                  <td className="text-ink/70 px-4 py-3 align-top text-xs">
                    {(p.pillars ?? [])
                      .map(
                        (s) => PILLARS[s as keyof typeof PILLARS]?.name ?? s
                      )
                      .join(", ") || (
                      <span className="text-ink/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 capitalize ${
                        STATUS_STYLES[p.status] || "bg-stone text-ink/60"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="text-ink/60 px-4 py-3 align-top text-xs">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-ink/60 text-xs">
          {totalCount === 0
            ? "0 picks"
            : `Showing ${fromIndex}–${toIndex} of ${totalCount}`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="text-ink hover:border-sage hover:text-sage rounded-full border border-stone bg-white px-3 py-1.5 text-xs"
              >
                ← Prev
              </Link>
            ) : (
              <span className="text-ink/40 rounded-full border border-stone px-3 py-1.5 text-xs">
                ← Prev
              </span>
            )}
            <span className="text-ink/70 text-xs">
              Page <strong>{page}</strong> of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="text-ink hover:border-sage hover:text-sage rounded-full border border-stone bg-white px-3 py-1.5 text-xs"
              >
                Next →
              </Link>
            ) : (
              <span className="text-ink/40 rounded-full border border-stone px-3 py-1.5 text-xs">
                Next →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
