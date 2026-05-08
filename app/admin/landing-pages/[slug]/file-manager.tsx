"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const STORAGE_PUBLIC_BASE =
  "https://bdhujqomjvfgzbgicwev.supabase.co/storage/v1/object/public/landing-pages";

const TEXT_EXTENSIONS = new Set([
  "html",
  "htm",
  "css",
  "js",
  "mjs",
  "json",
  "svg",
  "txt",
  "xml",
  "map",
  "md",
]);

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "avif",
]);

const MIME_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  avif: "image/avif",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
};

function ext(path: string): string {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

function getMimeType(path: string): string {
  return MIME_TYPES[ext(path)] ?? "application/octet-stream";
}

function isText(path: string): boolean {
  return TEXT_EXTENSIONS.has(ext(path));
}

function isImage(path: string): boolean {
  return IMAGE_EXTENSIONS.has(ext(path));
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

type FileRow = { path: string; size: number };

type Banner = { kind: "ok" | "err"; text: string } | null;

export default function FileManager({
  slug,
  entryFile,
}: {
  slug: string;
  entryFile: string;
}) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/landing-pages/${slug}/files?recursive=true`
      );
      const data = await res.json();
      if (!res.ok) {
        setBanner({ kind: "err", text: data.error || "Failed to list files." });
        setFiles([]);
        return;
      }
      setFiles(data.files ?? []);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Default-select the entry file once files are loaded
  useEffect(() => {
    if (selectedPath || files.length === 0) return;
    const entry = files.find((f) => f.path === entryFile) ?? files[0];
    if (entry) setSelectedPath(entry.path);
  }, [files, entryFile, selectedPath]);

  // Group files by top-level folder for the tree view
  const grouped = useMemo(() => {
    const map = new Map<string, FileRow[]>();
    for (const f of files) {
      const slash = f.path.indexOf("/");
      const folder = slash === -1 ? "" : f.path.substring(0, slash);
      if (!map.has(folder)) map.set(folder, []);
      map.get(folder)!.push(f);
    }
    // Sort: root first, then folders alphabetically
    const folders = [...map.keys()].sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return a.localeCompare(b);
    });
    return folders.map((folder) => ({
      folder,
      items: map.get(folder)!.sort((a, b) => a.path.localeCompare(b.path)),
    }));
  }, [files]);

  const selectedFile = useMemo(
    () => files.find((f) => f.path === selectedPath) ?? null,
    [files, selectedPath]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
      <FileTree
        groups={grouped}
        selectedPath={selectedPath}
        onSelect={setSelectedPath}
        loading={loading}
        entryFile={entryFile}
      />

      <div className="space-y-4">
        {banner && (
          <div
            role="alert"
            className={`rounded-md border p-3 text-sm ${
              banner.kind === "ok"
                ? "bg-mist border-sage/40 text-sage"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            {banner.text}
          </div>
        )}

        <AddFileForm
          slug={slug}
          onChange={() => {
            setBanner({ kind: "ok", text: "File added." });
            refresh();
          }}
          onError={(text) => setBanner({ kind: "err", text })}
        />

        {selectedFile && (
          <FileEditor
            slug={slug}
            file={selectedFile}
            isEntry={selectedFile.path === entryFile}
            onChanged={(text) => {
              setBanner({ kind: "ok", text });
              refresh();
            }}
            onError={(text) => setBanner({ kind: "err", text })}
            onDeleted={() => {
              setBanner({ kind: "ok", text: `Deleted ${selectedFile.path}.` });
              setSelectedPath(null);
              refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

function FileTree({
  groups,
  selectedPath,
  onSelect,
  loading,
  entryFile,
}: {
  groups: { folder: string; items: FileRow[] }[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  loading: boolean;
  entryFile: string;
}) {
  return (
    <aside className="border border-stone rounded-lg bg-white overflow-hidden">
      <div className="bg-cream border-b border-stone px-3 py-2 text-xs uppercase tracking-wide text-ink/60">
        Files
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-2 text-sm">
        {loading ? (
          <p className="text-ink/50 px-2 py-4 text-xs">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="text-ink/50 px-2 py-4 text-xs">No files.</p>
        ) : (
          groups.map(({ folder, items }) => (
            <div key={folder} className="mb-2">
              {folder !== "" && (
                <p className="text-ink/50 px-2 py-1 text-xs font-medium">
                  {folder}/
                </p>
              )}
              <ul>
                {items.map((f) => {
                  const display =
                    folder === ""
                      ? f.path
                      : f.path.substring(folder.length + 1);
                  const isSelected = f.path === selectedPath;
                  const isEntry = f.path === entryFile;
                  return (
                    <li key={f.path}>
                      <button
                        onClick={() => onSelect(f.path)}
                        className={`w-full text-left rounded px-2 py-1 truncate font-mono text-xs flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-sage text-cream"
                            : "text-ink hover:bg-mist"
                        }`}
                        title={f.path}
                      >
                        <span className="truncate">
                          {folder !== "" && (
                            <span className="opacity-60">└ </span>
                          )}
                          {display}
                          {isEntry && (
                            <span
                              className={`ml-1 ${
                                isSelected ? "text-cream/80" : "text-amber"
                              }`}
                            >
                              ★
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-[10px] tabular-nums ${
                            isSelected ? "text-cream/80" : "text-ink/40"
                          }`}
                        >
                          {formatBytes(f.size)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
      <p className="border-t border-stone bg-cream px-3 py-2 text-[10px] text-ink/50">
        ★ entry file
      </p>
    </aside>
  );
}

function FileEditor({
  slug,
  file,
  isEntry,
  onChanged,
  onError,
  onDeleted,
}: {
  slug: string;
  file: FileRow;
  isEntry: boolean;
  onChanged: (text: string) => void;
  onError: (text: string) => void;
  onDeleted: () => void;
}) {
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [busy, setBusy] = useState(false);

  // Re-fetch content whenever the selected file changes
  useEffect(() => {
    let cancelled = false;
    setContent("");
    setOriginalContent("");
    if (!isText(file.path)) return;
    setLoadingContent(true);
    // Cache-bust to avoid CDN serving stale content after a save
    fetch(
      `${STORAGE_PUBLIC_BASE}/${slug}/${encodeFilePath(file.path)}?ts=${Date.now()}`,
      { cache: "no-store" }
    )
      .then(async (r) => {
        if (!r.ok) throw new Error(`Fetch ${file.path} returned ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        setContent(text);
        setOriginalContent(text);
      })
      .catch((err) => {
        if (!cancelled)
          onError(`Failed to load "${file.path}": ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingContent(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file.path, slug, onError]);

  const dirty = content !== originalContent;

  async function handleSaveText() {
    setBusy(true);
    try {
      const blob = new Blob([content], { type: getMimeType(file.path) });
      await uploadOverwrite(slug, file.path, blob);
      setOriginalContent(content);
      onChanged(`Saved ${file.path}.`);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Save failed for some reason."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleReplace(newFile: File) {
    setBusy(true);
    try {
      await uploadOverwrite(slug, file.path, newFile);
      onChanged(`Replaced ${file.path}.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Replace failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (isEntry) {
      onError(
        "Cannot delete the entry file. Change the entry file first or delete the whole landing page."
      );
      return;
    }
    if (!confirm(`Delete ${file.path}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/landing-pages/${slug}/files?path=${encodeURIComponent(
          file.path
        )}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Delete returned ${res.status}`);
      onDeleted();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-stone rounded-lg bg-white overflow-hidden">
      <header className="bg-cream border-b border-stone px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ink font-mono text-sm truncate" title={file.path}>
            {file.path}
            {isEntry && <span className="text-amber ml-2">★ entry</span>}
          </p>
          <p className="text-ink/50 text-xs">{formatBytes(file.size)}</p>
        </div>
        <div className="flex items-center gap-2">
          <ReplaceButton onPick={handleReplace} disabled={busy} />
          <button
            onClick={handleDelete}
            disabled={busy}
            className="text-xs text-red-700 hover:text-red-900 disabled:opacity-50 px-3 py-1.5"
          >
            Delete
          </button>
        </div>
      </header>

      <div className="p-4">
        {isText(file.path) ? (
          <>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              disabled={loadingContent || busy}
              className="bg-cream border border-stone rounded-md w-full p-3 font-mono text-xs leading-relaxed focus:outline-none focus:border-sage min-h-[420px] disabled:opacity-50"
              placeholder={loadingContent ? "Loading..." : ""}
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-ink/50 text-xs">
                {dirty ? "Unsaved changes" : "Up to date"}
              </p>
              <button
                onClick={handleSaveText}
                disabled={!dirty || busy || loadingContent}
                className="bg-sage text-cream px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : isImage(file.path) ? (
          <div className="bg-cream border border-stone rounded-md p-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${STORAGE_PUBLIC_BASE}/${slug}/${encodeFilePath(
                file.path
              )}?ts=${Date.now()}`}
              alt={file.path}
              className="max-h-[420px] mx-auto"
            />
          </div>
        ) : (
          <p className="text-ink/60 text-sm">
            This file type isn&apos;t editable in-browser. Use Replace to upload
            a new version, or Delete to remove it.
          </p>
        )}
      </div>
    </section>
  );
}

function ReplaceButton({
  onPick,
  disabled,
}: {
  onPick: (file: File) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="bg-sage text-cream px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50"
      >
        Replace
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

function AddFileForm({
  slug,
  onChange,
  onError,
}: {
  slug: string;
  onChange: () => void;
  onError: (text: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [path, setPath] = useState("");
  const [busy, setBusy] = useState(false);

  // Auto-fill the target path with the picked file's name (no nested folders)
  useEffect(() => {
    if (file && !path) setPath(file.name);
  }, [file, path]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      onError("Pick a file first.");
      return;
    }
    const cleanPath = path.trim();
    if (!cleanPath) {
      onError("Target path is required.");
      return;
    }
    if (
      cleanPath.includes("..") ||
      cleanPath.startsWith("/") ||
      cleanPath.startsWith("\\")
    ) {
      onError("Invalid path.");
      return;
    }

    setBusy(true);
    try {
      await uploadAdd(slug, cleanPath, file);
      setFile(null);
      setPath("");
      onChange();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Add failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleAdd}
      className="border border-stone rounded-lg bg-white p-4 flex flex-wrap gap-3 items-end"
    >
      <div className="flex-1 min-w-[180px]">
        <label className="text-ink/70 text-xs uppercase tracking-wide block mb-1">
          New file
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm block"
        />
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="text-ink/70 text-xs uppercase tracking-wide block mb-1">
          Path inside bundle
        </label>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="images/new-hero.png"
          className="bg-white border border-stone rounded-md px-3 py-2 text-sm font-mono w-full"
        />
      </div>
      <button
        type="submit"
        disabled={!file || busy}
        className="bg-sage text-cream px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Adding..." : "Add"}
      </button>
    </form>
  );
}

// ---- helpers ----

function encodeFilePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function getSignedUrl(
  slug: string,
  path: string,
  upsert: boolean
): Promise<{ path: string; token: string }> {
  const res = await fetch(
    `/api/admin/landing-pages/${slug}/files/sign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, upsert }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Sign returned ${res.status}`);
  }
  return { path: data.path, token: data.token };
}

async function uploadOverwrite(
  slug: string,
  path: string,
  body: Blob | File
): Promise<void> {
  const { path: signedPath, token } = await getSignedUrl(slug, path, true);
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from("landing-pages")
    .uploadToSignedUrl(signedPath, token, body, {
      contentType: getMimeType(path),
      upsert: true,
    });
  if (error) throw new Error(error.message);
}

async function uploadAdd(
  slug: string,
  path: string,
  file: File
): Promise<void> {
  const { path: signedPath, token } = await getSignedUrl(slug, path, false);
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from("landing-pages")
    .uploadToSignedUrl(signedPath, token, file, {
      contentType: getMimeType(path),
    });
  if (error) throw new Error(error.message);
}
