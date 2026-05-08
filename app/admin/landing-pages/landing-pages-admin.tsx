"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LandingPage = {
  slug: string;
  title: string;
  description: string | null;
  entry_file: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function LandingPagesAdmin({
  pages,
}: {
  pages: LandingPage[];
}) {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-sage text-cream px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
        >
          {showUpload ? "Cancel" : "Upload new page"}
        </button>
      </div>

      {showUpload && (
        <UploadForm
          onSuccess={() => {
            setShowUpload(false);
            router.refresh();
          }}
        />
      )}

      {pages.length === 0 ? (
        <div className="bg-cream border border-stone rounded-lg p-12 text-center text-ink/60">
          No landing pages yet.
        </div>
      ) : (
        <div className="border border-stone rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream border-b border-stone">
              <tr>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Entry</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Updated</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr
                  key={p.slug}
                  className="border-b border-stone last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`/lp/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sage hover:text-amber font-mono text-xs"
                    >
                      /lp/{p.slug}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ink">{p.title}</td>
                  <td className="px-4 py-3 text-ink/60 font-mono text-xs">
                    {p.entry_file}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs uppercase tracking-wide ${
                        p.is_active
                          ? "bg-mist text-sage"
                          : "bg-stone/30 text-ink/60"
                      }`}
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/60 text-xs">
                    {new Date(p.updated_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <ToggleButton
                      page={p}
                      onChange={() => router.refresh()}
                    />
                    <DeleteButton
                      page={p}
                      onChange={() => router.refresh()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Pick a file first.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("file", file);

      const res = await fetch("/api/admin/landing-pages/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed.");
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-cream border border-stone rounded-lg p-6 space-y-4"
    >
      <div>
        <label className="text-ink/70 text-xs uppercase tracking-wide block mb-1">
          Slug (URL path: /lp/&lt;slug&gt;)
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
          }
          placeholder="spring-promo"
          required
          className="w-full border border-stone rounded-md px-3 py-2 text-sm bg-white"
        />
        <p className="text-ink/50 text-xs mt-1">
          Lowercase letters, digits, and hyphens only.
        </p>
      </div>

      <div>
        <label className="text-ink/70 text-xs uppercase tracking-wide block mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-stone rounded-md px-3 py-2 text-sm bg-white"
        />
      </div>

      <div>
        <label className="text-ink/70 text-xs uppercase tracking-wide block mb-1">
          Description (optional, internal only)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-stone rounded-md px-3 py-2 text-sm bg-white"
        />
      </div>

      <div>
        <label className="text-ink/70 text-xs uppercase tracking-wide block mb-1">
          File (.zip bundle or single .html)
        </label>
        <input
          type="file"
          accept=".zip,.html,.htm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
          className="w-full text-sm"
        />
        {file && (
          <p className="text-ink/60 text-xs mt-1">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-700 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isUploading}
          className="bg-sage text-cream px-6 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </form>
  );
}

function ToggleButton({
  page,
  onChange,
}: {
  page: LandingPage;
  onChange: () => void;
}) {
  const [isWorking, setIsWorking] = useState(false);

  async function handleToggle() {
    setIsWorking(true);
    try {
      await fetch(`/api/admin/landing-pages/${page.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !page.is_active }),
      });
      onChange();
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isWorking}
      className="text-xs text-sage hover:text-amber disabled:opacity-50"
    >
      {page.is_active ? "Deactivate" : "Activate"}
    </button>
  );
}

function DeleteButton({
  page,
  onChange,
}: {
  page: LandingPage;
  onChange: () => void;
}) {
  const [isWorking, setIsWorking] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Delete /lp/${page.slug} and all its files? This cannot be undone.`
      )
    ) {
      return;
    }
    setIsWorking(true);
    try {
      await fetch(`/api/admin/landing-pages/${page.slug}`, {
        method: "DELETE",
      });
      onChange();
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isWorking}
      className="text-xs text-red-700 hover:text-red-900 disabled:opacity-50"
    >
      Delete
    </button>
  );
}
