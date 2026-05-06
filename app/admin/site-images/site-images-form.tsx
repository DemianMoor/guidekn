"use client";

import { useRef, useState } from "react";

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

export function SiteImagesForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const [homepageHero, setHomepageHero] = useState(
    initial.homepage_hero_image || ""
  );
  const [aboutHero, setAboutHero] = useState(initial.about_hero_image || "");
  const [founderName, setFounderName] = useState(
    initial.founder_name || "Demian Moor"
  );
  const [founderTitle, setFounderTitle] = useState(
    initial.founder_title || "Founder & Editor"
  );
  const [founderBio, setFounderBio] = useState(initial.founder_bio || "");
  const [founderImage, setFounderImage] = useState(
    initial.founder_image || ""
  );

  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  async function handleSave() {
    setSave({ kind: "saving" });

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homepage_hero_image: homepageHero || null,
          about_hero_image: aboutHero || null,
          founder_name: founderName.trim(),
          founder_title: founderTitle.trim(),
          founder_bio: founderBio.trim(),
          founder_image: founderImage || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSave({
          kind: "error",
          message: data.error || "Couldn't save.",
        });
        return;
      }

      setSave({ kind: "saved" });
    } catch {
      setSave({
        kind: "error",
        message: "Couldn't reach the server.",
      });
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Homepage hero */}
      <section className="bg-white border-stone rounded-2xl border p-6 md:p-8">
        <h2 className="text-ink font-serif text-xl font-medium tracking-tight">
          Homepage hero
        </h2>
        <p className="text-ink/60 mt-2 text-sm">
          The full-width photo behind the &ldquo;Guidance from people who
          get it&rdquo; headline. Should feel editorial — natural light,
          candid people, not staged stock.
        </p>
        <SimpleImageUploader
          currentUrl={homepageHero}
          onUploaded={setHomepageHero}
          label="Homepage hero image"
          recommendedRatio="16:9 or wider, ideally 2400x1200px"
        />
      </section>

      {/* About hero */}
      <section className="bg-white border-stone rounded-2xl border p-6 md:p-8">
        <h2 className="text-ink font-serif text-xl font-medium tracking-tight">
          About page hero
        </h2>
        <p className="text-ink/60 mt-2 text-sm">
          The large photo near the top of the About page. Could be a
          workspace, an environment, or anything that conveys
          &ldquo;quiet editorial publication.&rdquo;
        </p>
        <SimpleImageUploader
          currentUrl={aboutHero}
          onUploaded={setAboutHero}
          label="About hero image"
          recommendedRatio="16:9 or wider, ideally 1600x900px"
        />
      </section>

      {/* Founder bio */}
      <section className="bg-white border-stone rounded-2xl border p-6 md:p-8">
        <h2 className="text-ink font-serif text-xl font-medium tracking-tight">
          Founder bio
        </h2>
        <p className="text-ink/60 mt-2 text-sm">
          Shown on the About page. As Guide Kin grows you can expand this
          section into a full team.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-ink text-xs font-medium">Name</span>
            <input
              type="text"
              value={founderName}
              onChange={(e) => setFounderName(e.target.value)}
              className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-ink text-xs font-medium">Title</span>
            <input
              type="text"
              value={founderTitle}
              onChange={(e) => setFounderTitle(e.target.value)}
              className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-ink text-xs font-medium">Bio</span>
          <textarea
            value={founderBio}
            onChange={(e) => setFounderBio(e.target.value)}
            rows={5}
            className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm leading-relaxed focus:border-sage focus:outline-none"
          />
        </label>

        <div className="mt-6">
          <p className="text-ink text-xs font-medium">Portrait photo (optional)</p>
          <p className="text-ink/60 mt-1 text-xs">
            A square or near-square photo. Casual, natural, not a corporate
            headshot.
          </p>
          <SimpleImageUploader
            currentUrl={founderImage}
            onUploaded={setFounderImage}
            label="Founder portrait"
            recommendedRatio="1:1 (square), ideally 800x800px"
            compact
          />
        </div>
      </section>

      {/* Save */}
      <div className="bg-white border-stone rounded-2xl border p-6 md:p-8 sticky bottom-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            {save.kind === "saved" && (
              <p className="text-sage text-sm">All changes saved. Refresh the homepage to see them live.</p>
            )}
            {save.kind === "error" && (
              <p className="text-amber text-sm">{save.message}</p>
            )}
            {save.kind === "idle" && (
              <p className="text-ink/60 text-xs">Click save to push changes live.</p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={save.kind === "saving"}
            className="bg-sage cursor-pointer rounded-full px-6 py-3 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {save.kind === "saving" ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Smaller image uploader used in this form (different layout from article editor)
function SimpleImageUploader({
  currentUrl,
  onUploaded,
  label,
  recommendedRatio,
  compact = false,
}: {
  currentUrl: string;
  onUploaded: (url: string) => void;
  label: string;
  recommendedRatio: string;
  compact?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("File must be an image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large. Max 10MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/images/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }

      onUploaded(data.url);
    } catch {
      setError("Upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          if (inputRef.current) inputRef.current.value = "";
        }}
        className="hidden"
      />

      {currentUrl && (
        <div className="mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt={label}
            className={`border-stone rounded-xl border object-cover ${
              compact ? "h-32 w-32" : "aspect-[16/9] w-full"
            }`}
          />
        </div>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files[0];
          if (file) uploadFile(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition ${
          dragActive
            ? "border-sage bg-mist"
            : "border-stone hover:border-sage hover:bg-mist/30"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? (
          <p className="text-ink/70 text-xs">Uploading...</p>
        ) : (
          <>
            <p className="text-ink text-xs font-medium">
              {currentUrl ? "Replace image" : "Drag here or click to upload"}
            </p>
            <p className="text-ink/60 mt-1 text-xs">{recommendedRatio}</p>
          </>
        )}
      </div>

      {error && <p className="text-amber mt-2 text-xs">{error}</p>}

      {currentUrl && (
        <button
          onClick={() => onUploaded("")}
          className="text-amber hover:text-sage mt-2 cursor-pointer text-xs"
        >
          Remove image
        </button>
      )}
    </div>
  );
}