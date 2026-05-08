"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type State =
  | { kind: "idle" }
  | { kind: "creating" }
  | { kind: "error"; message: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function NewPickForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [state, setState] = useState<State>({ kind: "idle" });

  // Pull existing categories so the editor can suggest them
  useEffect(() => {
    fetch("/api/admin/picks")
      .then((r) => r.json())
      .then((d) => {
        const cats = Array.from(
          new Set(
            (d.picks ?? [])
              .map((p: { category: string }) => p.category)
              .filter(Boolean)
          )
        ) as string[];
        setExistingCategories(cats.sort());
      })
      .catch(() => {});
  }, []);

  // Auto-update slug from title until the user edits it manually
  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(title));
  }, [title, slugTouched]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !category.trim()) return;

    setState({ kind: "creating" });
    try {
      const res = await fetch("/api/admin/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim().toLowerCase(),
          slug: slug.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({
          kind: "error",
          message: data.error || "Couldn't create pick.",
        });
        return;
      }
      router.push(`/admin/picks/${data.pick.id}/edit`);
      router.refresh();
    } catch {
      setState({
        kind: "error",
        message:
          "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  const creating = state.kind === "creating";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-stone mt-8 max-w-3xl rounded-2xl border p-6 md:p-10"
    >
      <div>
        <label htmlFor="title" className="text-ink block text-sm font-medium">
          Title
        </label>
        <p className="text-ink/60 mt-1 text-xs">
          You can refine this later. Something like &ldquo;Best percussion
          massagers&rdquo; or &ldquo;Travel kettles worth the suitcase
          space&rdquo;.
        </p>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={creating}
          className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-3 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none disabled:opacity-60"
        />
      </div>

      <div className="mt-6">
        <label
          htmlFor="category"
          className="text-ink block text-sm font-medium"
        >
          Category
        </label>
        <p className="text-ink/60 mt-1 text-xs">
          Lowercase letters, digits, and hyphens. Picks are grouped at
          <code className="text-ink/80 ml-1">/picks/&lt;category&gt;</code>.
        </p>
        <input
          id="category"
          type="text"
          required
          list="existing-categories"
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value.toLowerCase().replace(/\s+/g, "-")
            )
          }
          disabled={creating}
          placeholder="wellness"
          className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-3 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none disabled:opacity-60"
        />
        <datalist id="existing-categories">
          {existingCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {existingCategories.length > 0 && (
          <p className="text-ink/50 mt-2 text-xs">
            Existing: {existingCategories.join(", ")}
          </p>
        )}
      </div>

      <div className="mt-6">
        <label htmlFor="slug" className="text-ink block text-sm font-medium">
          Slug{" "}
          <span className="text-ink/50 text-xs font-normal">
            (auto from title — edit only if needed)
          </span>
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
          }}
          disabled={creating}
          className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-3 w-full rounded-xl border bg-white px-4 py-3 font-mono text-sm focus:outline-none disabled:opacity-60"
        />
        {category && slug && (
          <p className="text-ink/60 mt-2 text-xs">
            URL:{" "}
            <code className="text-ink/80">
              /picks/{category}/{slug}
            </code>
          </p>
        )}
      </div>

      {state.kind === "error" && (
        <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-4 text-sm text-ink">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={creating || !title.trim() || !category.trim()}
        className="bg-sage mt-8 w-full cursor-pointer rounded-full px-6 py-4 text-base text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {creating ? "Creating draft..." : "Create draft and open editor"}
      </button>
    </form>
  );
}
