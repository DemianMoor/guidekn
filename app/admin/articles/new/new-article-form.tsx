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

type Mode = "manual" | "ai";

type State =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "error"; message: string };

function PillarPicker({
  pillar,
  setPillar,
  disabled,
}: {
  pillar: string;
  setPillar: (p: string) => void;
  disabled: boolean;
}) {
  return (
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
            } ${disabled ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="pillar"
              value={p.slug}
              checked={checked}
              onChange={() => setPillar(p.slug)}
              disabled={disabled}
              className="sr-only"
            />
            <p
              className={`text-sm font-medium ${
                checked ? "text-sage" : "text-ink"
              }`}
            >
              {p.name}
            </p>
            <p className="text-ink/60 mt-1 text-xs leading-snug">{p.blurb}</p>
          </label>
        );
      })}
    </div>
  );
}

export function NewArticleForm({ editorName }: { editorName: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("manual");

  // Manual fields
  const [title, setTitle] = useState("");
  const [manualPillar, setManualPillar] = useState<string>("");

  // AI fields
  const [topic, setTopic] = useState("");
  const [aiPillar, setAiPillar] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [state, setState] = useState<State>({ kind: "idle" });
  const working = state.kind === "working";

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !manualPillar) return;

    setState({ kind: "working" });
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          pillar: manualPillar,
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
      router.push(`/admin/articles/${data.article.id}`);
      router.refresh();
    } catch {
      setState({
        kind: "error",
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  async function handleAiSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !aiPillar) return;

    setState({ kind: "working" });
    try {
      const res = await fetch("/api/admin/articles/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          pillar: aiPillar,
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
      router.push(`/admin/articles/${data.article.id}`);
      router.refresh();
    } catch {
      setState({
        kind: "error",
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  return (
    <div className="mt-8 max-w-3xl">
      {/* Mode toggle */}
      <div className="border-stone bg-white inline-flex rounded-full border p-1">
        <button
          type="button"
          onClick={() => {
            if (!working) {
              setMode("manual");
              setState({ kind: "idle" });
            }
          }}
          disabled={working}
          className={`cursor-pointer rounded-full px-5 py-2 text-sm transition ${
            mode === "manual" ? "bg-sage text-white" : "text-ink/70 hover:text-ink"
          } ${working ? "cursor-not-allowed opacity-60" : ""}`}
        >
          Write it yourself
        </button>
        <button
          type="button"
          onClick={() => {
            if (!working) {
              setMode("ai");
              setState({ kind: "idle" });
            }
          }}
          disabled={working}
          className={`cursor-pointer rounded-full px-5 py-2 text-sm transition ${
            mode === "ai" ? "bg-sage text-white" : "text-ink/70 hover:text-ink"
          } ${working ? "cursor-not-allowed opacity-60" : ""}`}
        >
          Generate with AI
        </button>
      </div>

      {/* MANUAL */}
      {mode === "manual" && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-white border-stone mt-4 rounded-2xl border p-6 md:p-10"
        >
          <div>
            <label htmlFor="title" className="text-ink block text-sm font-medium">
              Title
            </label>
            <p className="text-ink/60 mt-1 text-xs">
              You can refine this later. It also seeds the URL slug.
            </p>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={working}
              placeholder="The case for getting strong, not skinny, after 40."
              className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-3 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="mt-8">
            <label className="text-ink block text-sm font-medium">Pillar</label>
            <p className="text-ink/60 mt-1 text-xs">
              Which of the six pillars does this fit best?
            </p>
            <PillarPicker
              pillar={manualPillar}
              setPillar={setManualPillar}
              disabled={working}
            />
          </div>

          <div className="bg-mist border-stone mt-8 rounded-xl border p-4 text-xs">
            <p className="text-ink/70">
              Byline: <strong className="text-ink">{editorName}</strong>{" "}
              <span className="text-ink/50">(you can change this in the editor)</span>
            </p>
          </div>

          {state.kind === "error" && (
            <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-4 text-sm text-ink">
              {state.message}
            </div>
          )}

          <button
            type="submit"
            disabled={working || !title.trim() || !manualPillar}
            className="bg-sage mt-8 w-full cursor-pointer rounded-full px-6 py-4 text-base text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working ? "Creating draft..." : "Create draft and open editor"}
          </button>
          <p className="text-ink/60 mt-4 text-center text-xs">
            We&apos;ll create an empty draft and take you to the editor to write
            the body.
          </p>
        </form>
      )}

      {/* AI */}
      {mode === "ai" && (
        <form
          onSubmit={handleAiSubmit}
          className="bg-white border-stone mt-4 rounded-2xl border p-6 md:p-10"
        >
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
              disabled={working}
              placeholder="The case for getting strong, not skinny, after 40."
              className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-3 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="mt-8">
            <label className="text-ink block text-sm font-medium">Pillar</label>
            <p className="text-ink/60 mt-1 text-xs">
              Which of the six pillars does this fit best?
            </p>
            <PillarPicker
              pillar={aiPillar}
              setPillar={setAiPillar}
              disabled={working}
            />
          </div>

          <div className="mt-8">
            <label htmlFor="notes" className="text-ink block text-sm font-medium">
              Notes for the AI{" "}
              <span className="text-ink/50 font-normal">(optional)</span>
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
              disabled={working}
              placeholder="Reference the 2023 Layne Norton study on hypertrophy after 40. Keep it under 1000 words."
              className="border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-3 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="bg-mist border-stone mt-8 rounded-xl border p-4 text-xs">
            <p className="text-ink/70">
              Byline: <strong className="text-ink">{editorName}</strong>{" "}
              <span className="text-ink/50">(you can change this in the editor)</span>
            </p>
          </div>

          {state.kind === "error" && (
            <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-4 text-sm text-ink">
              {state.message}
            </div>
          )}

          <button
            type="submit"
            disabled={working || !topic.trim() || !aiPillar}
            className="bg-sage mt-8 w-full cursor-pointer rounded-full px-6 py-4 text-base text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working
              ? "Drafting your article — this takes 20–40 seconds..."
              : "Generate draft"}
          </button>

          {working && (
            <p className="text-ink/60 mt-4 text-center text-xs">
              Don&apos;t close this tab. We&apos;re working on it.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
