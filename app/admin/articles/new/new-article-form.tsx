"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PILLARS = [
  { slug: "body", name: "Body", blurb: "Health, strength, sleep, mobility." },
  { slug: "mind", name: "Mind", blurb: "Focus, calm, cognitive health." },
  { slug: "glow", name: "Glow", blurb: "Skincare, style, presentation." },
  { slug: "roam", name: "Roam", blurb: "Travel, weekends, exploration." },
  { slug: "bonds", name: "Bonds", blurb: "Friendships, family, partners." },
  { slug: "years", name: "Years", blurb: "Money, work, purpose, planning." },
];

type State =
  | { kind: "idle" }
  | { kind: "generating" }
  | { kind: "error"; message: string };

export function NewArticleForm({ editorName }: { editorName: string }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [pillar, setPillar] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !pillar) return;

    setState({ kind: "generating" });

    try {
      const res = await fetch("/api/admin/articles/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          pillar,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({
          kind: "error",
          message: data.error || "Something went wrong. Try again.",
        });
        return;
      }

      // Redirect to the article edit page
      router.push(`/admin/articles/${data.article.id}`);
      router.refresh();
    } catch {
      setState({
        kind: "error",
        message:
          "Couldn't reach the server. Check your connection and try again.",
      });
    }
  };

  const generating = state.kind === "generating";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-stone mt-8 max-w-3xl rounded-2xl border p-6 md:p-10"
    >
      {/* Topic */}
      <div>
        <label htmlFor="topic" className="text-ink block text-sm font-medium">
          Topic
        </label>
        <p className="text-ink/60 mt-1 text-xs">
          What&apos;s the article about? Be specific — &ldquo;why hip mobility
          matters more than knee mobility for adults 50+&rdquo; works better
          than &ldquo;mobility.&rdquo;
        </p>
        <textarea
          id="topic"
          name="topic"
          required
          rows={3}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={generating}
          placeholder="The case for getting strong, not skinny, after 40."
          className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-3 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Pillar */}
      <div className="mt-8">
        <label className="text-ink block text-sm font-medium">Pillar</label>
        <p className="text-ink/60 mt-1 text-xs">
          Which of the six pillars does this fit best?
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {PILLARS.map((p) => {
            const checked = pillar === p.slug;
            return (
              <label
                key={p.slug}
                className={`block cursor-pointer rounded-xl border px-4 py-3 transition ${
                  checked
                    ? "border-sage bg-mist"
                    : "border-stone bg-white hover:border-sage/50"
                } ${generating ? "pointer-events-none opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="pillar"
                  value={p.slug}
                  checked={checked}
                  onChange={() => setPillar(p.slug)}
                  disabled={generating}
                  className="sr-only"
                />
                <p
                  className={`text-sm font-medium ${
                    checked ? "text-sage" : "text-ink"
                  }`}
                >
                  {p.name}
                </p>
                <p className="text-ink/60 mt-1 text-xs leading-snug">
                  {p.blurb}
                </p>
              </label>
            );
          })}
        </div>
      </div>

      {/* Optional notes */}
      <div className="mt-8">
        <label htmlFor="notes" className="text-ink block text-sm font-medium">
          Notes for the AI <span className="text-ink/50 font-normal">(optional)</span>
        </label>
        <p className="text-ink/60 mt-1 text-xs">
          Anything specific you want the draft to include — a study to cite, a
          personal angle to lean on, structure to follow. Keep it short.
        </p>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={generating}
          placeholder="Reference the 2023 Layne Norton study on hypertrophy after 40. Keep it under 1000 words."
          className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-3 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Byline preview */}
      <div className="bg-mist border-stone mt-8 rounded-xl border p-4 text-xs">
        <p className="text-ink/70">
          Byline: <strong className="text-ink">{editorName}</strong>{" "}
          <span className="text-ink/50">(you can change this in the editor)</span>
        </p>
      </div>

      {/* Error */}
      {state.kind === "error" && (
        <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-4 text-sm text-ink">
          {state.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={generating || !topic.trim() || !pillar}
        className="bg-sage mt-8 w-full cursor-pointer rounded-full px-6 py-4 text-base text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {generating ? "Drafting your article — this takes 20–40 seconds..." : "Generate draft"}
      </button>

      {generating && (
        <p className="text-ink/60 mt-4 text-center text-xs">
          Don&apos;t close this tab. We&apos;re working on it.
        </p>
      )}
    </form>
  );
}