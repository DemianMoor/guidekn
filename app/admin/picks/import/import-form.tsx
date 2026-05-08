"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type ImportResultRow =
  | {
      row: number;
      status: "imported";
      pick_slug: string;
      product_name: string;
    }
  | {
      row: number;
      status: "skipped";
      reason: string;
      pick_slug?: string;
      product_name?: string;
    }
  | {
      row: number;
      status: "error";
      reason: string;
      pick_slug?: string;
      product_name?: string;
    };

type ImportResponse = {
  summary: {
    total: number;
    imported: number;
    skipped: number;
    errors: number;
    picks_created: number;
  };
  results: ImportResultRow[];
};

export default function ImportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(f: File | null) {
    setError(null);
    setResult(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a .csv file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File is too large. Max 5MB.");
      return;
    }
    setFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  }

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/picks/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Upload failed (status ${res.status})`);
        if (data.details) {
          setError(
            `${data.error}: ${data.details
              .map(
                (d: { row: number; message: string }) =>
                  `row ${d.row} — ${d.message}`
              )
              .join("; ")}`
          );
        }
      } else {
        setResult(data as ImportResponse);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Template download */}
      <div className="bg-cream border border-stone rounded-lg p-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-medium text-ink mb-1">Need the format?</h2>
          <p className="text-sm text-ink/70">
            Download a template CSV with two example round-ups (foam rollers +
            travel kettles) showing every column and cell-level format.
          </p>
        </div>
        <a
          href="/api/admin/picks/import/template"
          className="bg-sage text-cream px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 whitespace-nowrap"
        >
          Download template
        </a>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition ${
          isDragging
            ? "border-sage bg-mist"
            : "border-stone bg-white hover:border-sage/60 hover:bg-cream"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div>
            <p className="text-ink font-medium mb-1">{file.name}</p>
            <p className="text-sm text-ink/60">
              {(file.size / 1024).toFixed(1)} KB &middot; click or drag to
              replace
            </p>
          </div>
        ) : (
          <div>
            <p className="text-ink mb-1">
              Drop your CSV here, or click to browse
            </p>
            <p className="text-sm text-ink/60">.csv only, up to 5MB</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="bg-sage text-cream px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
        >
          {isUploading ? "Importing..." : "Import picks"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-900 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-mist border border-stone rounded-lg p-4">
            <h2 className="font-medium text-ink mb-3">Import summary</h2>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-serif text-ink">
                  {result.summary.total}
                </div>
                <div className="text-xs text-ink/60 uppercase tracking-wide">
                  Total rows
                </div>
              </div>
              <div>
                <div className="text-2xl font-serif text-sage">
                  {result.summary.picks_created}
                </div>
                <div className="text-xs text-ink/60 uppercase tracking-wide">
                  Picks created
                </div>
              </div>
              <div>
                <div className="text-2xl font-serif text-sage">
                  {result.summary.imported}
                </div>
                <div className="text-xs text-ink/60 uppercase tracking-wide">
                  Products imported
                </div>
              </div>
              <div>
                <div className="text-2xl font-serif text-amber">
                  {result.summary.skipped}
                </div>
                <div className="text-xs text-ink/60 uppercase tracking-wide">
                  Skipped
                </div>
              </div>
              <div>
                <div className="text-2xl font-serif text-red-700">
                  {result.summary.errors}
                </div>
                <div className="text-xs text-ink/60 uppercase tracking-wide">
                  Errors
                </div>
              </div>
            </div>
          </div>

          <div className="border border-stone rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream border-b border-stone">
                <tr>
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Pick</th>
                  <th className="px-3 py-2 text-left">Product / reason</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r, i) => (
                  <tr
                    key={`${r.row}-${i}`}
                    className="border-b border-stone last:border-b-0"
                  >
                    <td className="px-3 py-2 text-ink/60">{r.row}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs uppercase tracking-wide ${
                          r.status === "imported"
                            ? "bg-mist text-sage"
                            : r.status === "skipped"
                              ? "bg-amber/10 text-amber"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink/80 font-mono text-xs">
                      {r.pick_slug ?? (
                        <span className="text-ink/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-ink">
                      {r.status === "imported" ? (
                        <span className="font-medium">{r.product_name}</span>
                      ) : (
                        <>
                          {r.product_name && (
                            <span className="font-medium">
                              {r.product_name}{" "}
                            </span>
                          )}
                          <span className="text-ink/60">{r.reason}</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.summary.picks_created > 0 && (
            <div className="text-sm">
              <Link
                href="/admin/picks"
                className="text-sage hover:text-amber font-medium"
              >
                ← Back to picks list
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
