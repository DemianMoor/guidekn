"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PILLARS } from "@/lib/brand-voice";

const PILLAR_LIST = Object.keys(PILLARS).map((slug) => ({
  slug,
  name: PILLARS[slug as keyof typeof PILLARS].name,
}));

export default function PicksFilters({
  categories,
}: {
  categories: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentPillar = searchParams.get("pillar") ?? "";

  // Local input value so typing doesn't immediately reload on every keystroke.
  // Submit-on-Enter (the form's onSubmit) is what pushes the URL.
  const [qInput, setQInput] = useState(currentQ);
  useEffect(() => {
    setQInput(currentQ);
  }, [currentQ]);

  function buildHref(updates: Record<string, string | null>): string {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    // Any filter change resets pagination
    params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function setParam(key: string, value: string) {
    router.push(buildHref({ [key]: value || null }));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildHref({ q: qInput.trim() || null }));
  }

  const hasAnyFilter =
    currentQ || currentCategory || currentStatus || currentPillar;

  return (
    <div className="bg-white border-stone mt-6 rounded-2xl border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 min-w-[200px]"
          role="search"
        >
          <label className="text-ink/60 block text-xs font-medium uppercase tracking-wide">
            Search title
          </label>
          <input
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="e.g., percussion massagers"
            className="border-stone text-ink mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
          />
        </form>

        <div>
          <label className="text-ink/60 block text-xs font-medium uppercase tracking-wide">
            Category
          </label>
          <select
            value={currentCategory}
            onChange={(e) => setParam("category", e.target.value)}
            className="border-stone text-ink mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none capitalize"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-ink/60 block text-xs font-medium uppercase tracking-wide">
            Status
          </label>
          <select
            value={currentStatus}
            onChange={(e) => setParam("status", e.target.value)}
            className="border-stone text-ink mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div>
          <label className="text-ink/60 block text-xs font-medium uppercase tracking-wide">
            Pillar
          </label>
          <select
            value={currentPillar}
            onChange={(e) => setParam("pillar", e.target.value)}
            className="border-stone text-ink mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
          >
            <option value="">All</option>
            {PILLAR_LIST.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="text-amber hover:text-sage cursor-pointer text-xs"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
