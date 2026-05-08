"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Pick, PickProduct } from "@/lib/picks-types";
import { COMMON_BADGES } from "@/lib/picks-types";
import { PILLARS } from "@/lib/brand-voice";

// ----- Types and helpers --------------------------------------------------

const PILLAR_LIST = Object.keys(PILLARS).map((slug) => ({
  slug,
  name: PILLARS[slug as keyof typeof PILLARS].name,
}));

// Each product carries a stable client-side id so dnd-kit and React keys
// remain consistent across rerenders, even before the row has a real UUID.
type EditorProduct = PickProduct & { _clientId: string };

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string };

let _tmpCounter = 0;
function newClientId(): string {
  _tmpCounter += 1;
  return `tmp-${Date.now()}-${_tmpCounter}`;
}

function blankProduct(): EditorProduct {
  const id = newClientId();
  return {
    _clientId: id,
    id: "",
    pick_id: "",
    position: 0,
    badge: null,
    name: "",
    brand: null,
    image_url: null,
    image_alt: null,
    take: "",
    pros: null,
    cons: null,
    specs: null,
    retailer_name: null,
    retailer_url: null,
    created_at: "",
    updated_at: "",
  };
}

function toLocalDatetimeInput(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// ----- Main editor --------------------------------------------------------

export function PickEditor({
  pick: initial,
  products: initialProducts,
  existingCategories,
}: {
  pick: Pick;
  products: PickProduct[];
  existingCategories: string[];
}) {
  const router = useRouter();

  // Pick-level state
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [category, setCategory] = useState(initial.category);
  const [dek, setDek] = useState(initial.dek ?? "");
  const [intro, setIntro] = useState(initial.intro ?? "");
  const [methodology, setMethodology] = useState(initial.methodology ?? "");
  const [byline, setByline] = useState(initial.byline);
  const [pillars, setPillars] = useState<string[]>(initial.pillars ?? []);
  const [heroUrl, setHeroUrl] = useState(initial.hero_image_url ?? "");
  const [heroAlt, setHeroAlt] = useState(initial.hero_image_alt ?? "");
  const [seoTitle, setSeoTitle] = useState(initial.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(initial.seo_description ?? "");
  const [status, setStatus] = useState<"draft" | "published">(initial.status);
  const [publishedAt, setPublishedAt] = useState(
    initial.published_at ? toLocalDatetimeInput(initial.published_at) : ""
  );

  // Products list — stamp every existing row with a stable client id
  const [products, setProducts] = useState<EditorProduct[]>(() =>
    initialProducts.map((p) => ({ ...p, _clientId: p.id || newClientId() }))
  );

  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [showDelete, setShowDelete] = useState(false);

  function togglePillar(slugVal: string) {
    setPillars((prev) =>
      prev.includes(slugVal)
        ? prev.filter((s) => s !== slugVal)
        : [...prev, slugVal]
    );
  }

  function addProduct() {
    setProducts((prev) => [...prev, blankProduct()]);
  }

  function updateProduct(clientId: string, patch: Partial<EditorProduct>) {
    setProducts((prev) =>
      prev.map((p) => (p._clientId === clientId ? { ...p, ...patch } : p))
    );
  }

  function deleteProduct(clientId: string) {
    setProducts((prev) => prev.filter((p) => p._clientId !== clientId));
  }

  // ---- Save -------------------------------------------------------------

  async function save(opts: { newStatus?: "draft" | "published" } = {}) {
    setSaveState({ kind: "saving" });

    // 1. Pick metadata
    const metaPayload: Record<string, unknown> = {
      title: title.trim(),
      slug: slug.trim(),
      category: category.trim().toLowerCase(),
      dek: dek.trim(),
      intro,
      methodology,
      byline: byline.trim(),
      pillars,
      hero_image_url: heroUrl.trim(),
      hero_image_alt: heroAlt.trim(),
      seo_title: seoTitle.trim(),
      seo_description: seoDesc.trim(),
    };
    if (opts.newStatus) {
      metaPayload.status = opts.newStatus;
      if (opts.newStatus === "published" && !publishedAt) {
        metaPayload.published_at = new Date().toISOString();
      } else if (opts.newStatus === "draft") {
        metaPayload.published_at = null;
      } else if (publishedAt) {
        metaPayload.published_at = new Date(publishedAt).toISOString();
      }
    } else if (publishedAt) {
      metaPayload.published_at = new Date(publishedAt).toISOString();
    }

    try {
      const metaRes = await fetch(`/api/admin/picks/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaPayload),
      });
      const metaData = await metaRes.json();
      if (!metaRes.ok) {
        setSaveState({
          kind: "error",
          message: metaData.error || "Couldn't save pick.",
        });
        return false;
      }

      // 2. Products — strip client-only fields, only send a real id when the
      //    row already exists in the DB (UUID, not "tmp-..."). Server inserts
      //    new rows for any product missing an id and rewrites all positions.
      const productsPayload = products.map((p) => ({
        id: p.id && !p.id.startsWith("tmp-") ? p.id : undefined,
        badge: p.badge ?? "",
        name: p.name,
        brand: p.brand ?? "",
        image_url: p.image_url ?? "",
        image_alt: p.image_alt ?? "",
        take: p.take ?? "",
        pros: p.pros ?? [],
        cons: p.cons ?? [],
        specs: p.specs ?? {},
        retailer_name: p.retailer_name ?? "",
        retailer_url: p.retailer_url ?? "",
      }));

      const prodRes = await fetch(
        `/api/admin/picks/${initial.id}/products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: productsPayload }),
        }
      );
      const prodData = await prodRes.json();
      if (!prodRes.ok) {
        setSaveState({
          kind: "error",
          message: prodData.error || "Couldn't save products.",
        });
        return false;
      }

      // Refresh published_at from response if status changed
      if (opts.newStatus) {
        setStatus(opts.newStatus);
        if (metaData.pick?.published_at) {
          setPublishedAt(toLocalDatetimeInput(metaData.pick.published_at));
        } else {
          setPublishedAt("");
        }
      }

      setSaveState({ kind: "saved", at: Date.now() });
      router.refresh();
      return true;
    } catch {
      setSaveState({
        kind: "error",
        message: "Couldn't reach the server.",
      });
      return false;
    }
  }

  async function deletePick() {
    const res = await fetch(`/api/admin/picks/${initial.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setSaveState({ kind: "error", message: "Couldn't delete pick." });
      return;
    }
    router.push("/admin/picks");
  }

  // ---- Drag and drop ----------------------------------------------------

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setProducts((prev) => {
      const oldIndex = prev.findIndex((p) => p._clientId === active.id);
      const newIndex = prev.findIndex((p) => p._clientId === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  const productIds = useMemo(
    () => products.map((p) => p._clientId),
    [products]
  );

  const statusStyles: Record<string, string> = {
    draft: "bg-stone/40 text-ink/70",
    published: "bg-mist text-sage",
  };

  return (
    <div>
      {/* ---- Header ---- */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-stone border-b pb-6">
        <div>
          <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
            Picks /{" "}
            <Link href="/admin/picks" className="hover:text-sage">
              all
            </Link>
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs capitalize ${statusStyles[status]}`}
            >
              {status}
            </span>
            <SaveStateLabel state={saveState} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {status === "published" && (
            <Link
              href={`/picks/${category}/${slug}`}
              target="_blank"
              rel="noopener"
              className="text-ink hover:border-sage hover:text-sage rounded-full border border-stone px-4 py-2 text-sm"
            >
              View live ↗
            </Link>
          )}
          <button
            onClick={() => save()}
            disabled={saveState.kind === "saving"}
            className="text-ink hover:border-sage hover:text-sage cursor-pointer rounded-full border border-stone px-4 py-2 text-sm disabled:opacity-50"
          >
            {saveState.kind === "saving" ? "Saving..." : "Save"}
          </button>
          {status === "draft" ? (
            <button
              onClick={() => save({ newStatus: "published" })}
              disabled={saveState.kind === "saving"}
              className="bg-sage cursor-pointer rounded-full px-5 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              Save &amp; publish
            </button>
          ) : (
            <button
              onClick={() => save({ newStatus: "draft" })}
              disabled={saveState.kind === "saving"}
              className="text-ink hover:border-sage hover:text-sage cursor-pointer rounded-full border border-stone px-4 py-2 text-sm disabled:opacity-50"
            >
              Unpublish
            </button>
          )}
        </div>
      </div>

      {/* ---- Main grid: content + sidebar ---- */}
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
              placeholder="Best percussion massagers"
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
              Intro (markdown)
            </span>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={10}
              className="prose-editorial text-ink/85 border-stone mt-2 w-full rounded-xl border p-4 leading-relaxed focus:border-sage focus:outline-none"
              placeholder="The framing — why we tested these, who they're for, how they fit into Guide Kin's pillars..."
            />
          </label>

          <label className="mt-6 block">
            <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              How we tested (markdown)
            </span>
            <textarea
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              rows={6}
              className="prose-editorial text-ink/85 border-stone mt-2 w-full rounded-xl border p-4 leading-relaxed focus:border-sage focus:outline-none"
              placeholder="Each device was used over six weeks of daily recovery sessions..."
            />
          </label>
        </div>

        {/* ---- Sidebar ---- */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white border-stone rounded-2xl border p-6">
            <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              Metadata
            </p>

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
              <span className="text-ink text-xs font-medium">Category</span>
              <input
                type="text"
                list="pick-existing-categories"
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value.toLowerCase().replace(/\s+/g, "-")
                  )
                }
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 font-mono text-xs focus:border-sage focus:outline-none"
              />
              <datalist id="pick-existing-categories">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>

            <label className="mt-4 block">
              <span className="text-ink text-xs font-medium">Slug</span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 font-mono text-xs focus:border-sage focus:outline-none"
              />
              <p className="text-ink/60 mt-1 text-xs">
                URL:{" "}
                <code className="text-ink/80">
                  /picks/{category}/{slug}
                </code>
              </p>
              {status === "published" &&
                (slug !== initial.slug || category !== initial.category) && (
                  <p className="text-amber mt-2 text-xs">
                    Warning: changing the URL breaks any links already shared.
                  </p>
                )}
            </label>

            <div className="mt-4">
              <p className="text-ink text-xs font-medium">Pillars</p>
              <p className="text-ink/60 mt-1 text-xs">
                Used to surface this pick on the matching pillar pages.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {PILLAR_LIST.map((p) => {
                  const checked = pillars.includes(p.slug);
                  return (
                    <label
                      key={p.slug}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
                        checked
                          ? "border-sage bg-mist text-sage"
                          : "border-stone bg-white text-ink hover:border-sage/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePillar(p.slug)}
                        className="sr-only"
                      />
                      {p.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-ink text-xs font-medium">Publish date</span>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
              />
              <p className="text-ink/60 mt-1 text-xs">
                Leave blank to use the current time when you publish.
              </p>
              {publishedAt && (
                <button
                  type="button"
                  onClick={() => setPublishedAt("")}
                  className="text-amber hover:text-sage mt-2 cursor-pointer text-xs"
                >
                  Clear date
                </button>
              )}
            </label>
          </div>

          {/* Hero image */}
          <div className="bg-white border-stone rounded-2xl border p-6">
            <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              Hero image
            </p>
            <p className="text-ink/60 mt-1 text-xs">
              Renders above the intro on the pick page. Leave blank for
              category fallback.
            </p>
            <label className="mt-3 block">
              <span className="text-ink text-xs font-medium">Image URL</span>
              <input
                type="url"
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                placeholder="https://..."
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
              />
            </label>
            <label className="mt-3 block">
              <span className="text-ink text-xs font-medium">Alt text</span>
              <textarea
                value={heroAlt}
                onChange={(e) => setHeroAlt(e.target.value)}
                rows={2}
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
              />
            </label>
            {heroUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroUrl}
                alt={heroAlt}
                className="border-stone mt-4 aspect-[4/3] w-full rounded-xl border object-cover"
              />
            )}
          </div>

          {/* SEO */}
          <div className="bg-white border-stone rounded-2xl border p-6">
            <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              SEO
            </p>
            <label className="mt-3 block">
              <span className="text-ink text-xs font-medium">SEO title</span>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Falls back to title if blank"
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
              />
            </label>
            <label className="mt-3 block">
              <span className="text-ink text-xs font-medium">
                SEO description
              </span>
              <textarea
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                rows={3}
                placeholder="Falls back to dek if blank"
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
              />
            </label>
          </div>

          {/* Delete */}
          <div className="bg-white border-stone rounded-2xl border p-6">
            <button
              onClick={() => setShowDelete(true)}
              className="text-amber hover:text-sage cursor-pointer w-full text-center text-xs"
            >
              Delete this pick
            </button>
          </div>
        </div>
      </div>

      {/* ---- Products section ---- */}
      <div className="mt-12">
        <div className="flex items-center justify-between gap-4 border-stone border-b pb-4">
          <div>
            <h2 className="text-ink font-serif text-2xl font-medium tracking-tight">
              Products in this round-up
            </h2>
            <p className="text-ink/60 mt-1 text-xs">
              {products.length === 0
                ? "Add at least one product."
                : `${products.length} product${products.length === 1 ? "" : "s"} · drag the handle to reorder`}
            </p>
          </div>
          <button
            onClick={addProduct}
            className="bg-sage cursor-pointer rounded-full px-4 py-2 text-sm text-white hover:opacity-90 whitespace-nowrap"
          >
            + Add product
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={productIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="mt-6 space-y-4">
              {products.map((p, idx) => (
                <ProductRow
                  key={p._clientId}
                  product={p}
                  index={idx + 1}
                  onChange={(patch) => updateProduct(p._clientId, patch)}
                  onDelete={() => deleteProduct(p._clientId)}
                />
              ))}
              {products.length === 0 && (
                <div className="bg-cream border-stone rounded-2xl border border-dashed p-12 text-center">
                  <p className="text-ink/60 text-sm">
                    No products yet. Click <strong>+ Add product</strong>.
                  </p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* ---- Delete confirm modal ---- */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6">
          <div className="bg-white border-stone w-full max-w-md rounded-2xl border p-6 md:p-8">
            <h3 className="text-ink font-serif text-xl font-medium tracking-tight">
              Delete this pick?
            </h3>
            <p className="text-ink/70 mt-2 text-sm">
              Permanent. The pick at{" "}
              <code className="text-ink/80">
                /picks/{initial.category}/{initial.slug}
              </code>{" "}
              and all its products will be gone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="text-ink hover:border-sage hover:text-sage cursor-pointer rounded-full border border-stone px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={deletePick}
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

// ----- Product row (sortable) ---------------------------------------------

function ProductRow({
  product,
  index,
  onChange,
  onDelete,
}: {
  product: EditorProduct;
  index: number;
  onChange: (patch: Partial<EditorProduct>) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product._clientId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border-stone rounded-2xl border overflow-hidden"
    >
      {/* Header row — drag handle, summary, expand, delete */}
      <div className="flex items-center gap-3 p-4 border-stone border-b bg-cream">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="text-ink/40 hover:text-ink cursor-grab active:cursor-grabbing px-2 select-none"
        >
          ⋮⋮
        </button>
        <span className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
          #{index}
        </span>
        {product.badge && (
          <span className="bg-amber text-cream rounded-full px-2 py-0.5 text-xs uppercase tracking-wide">
            {product.badge}
          </span>
        )}
        <p className="text-ink flex-1 truncate text-sm font-medium">
          {product.name || "(untitled product)"}
          {product.brand && (
            <span className="text-ink/50 ml-2 font-normal">
              · {product.brand}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-ink/60 hover:text-sage cursor-pointer text-xs"
        >
          {open ? "Collapse" : "Expand"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-amber hover:text-red-700 cursor-pointer text-xs"
        >
          Delete
        </button>
      </div>

      {open && (
        <div className="p-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
                Name *
              </span>
              <input
                type="text"
                value={product.name}
                onChange={(e) => onChange({ name: e.target.value })}
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
                Brand
              </span>
              <input
                type="text"
                value={product.brand ?? ""}
                onChange={(e) => onChange({ brand: e.target.value })}
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
                Badge
              </span>
              <input
                type="text"
                list={`badges-${product._clientId}`}
                value={product.badge ?? ""}
                onChange={(e) => onChange({ badge: e.target.value })}
                placeholder="Best Overall, Best Budget, etc."
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
              />
              <datalist id={`badges-${product._clientId}`}>
                {COMMON_BADGES.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
                Image URL
              </span>
              <input
                type="url"
                value={product.image_url ?? ""}
                onChange={(e) => onChange({ image_url: e.target.value })}
                placeholder="https://..."
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              Image alt
            </span>
            <input
              type="text"
              value={product.image_alt ?? ""}
              onChange={(e) => onChange({ image_alt: e.target.value })}
              className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
              Take (markdown)
            </span>
            <textarea
              value={product.take}
              onChange={(e) => onChange({ take: e.target.value })}
              rows={5}
              className="prose-editorial text-ink/85 border-stone mt-2 w-full rounded-xl border p-3 text-sm leading-relaxed focus:border-sage focus:outline-none"
              placeholder="What we thought, what stood out, who it's for..."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <StringList
              label="Pros"
              accent="sage"
              items={product.pros ?? []}
              onChange={(items) =>
                onChange({ pros: items.length > 0 ? items : null })
              }
              placeholder="What we liked"
            />
            <StringList
              label="Cons"
              accent="amber"
              items={product.cons ?? []}
              onChange={(items) =>
                onChange({ cons: items.length > 0 ? items : null })
              }
              placeholder="Things to know"
            />
          </div>

          <SpecsEditor
            specs={product.specs ?? {}}
            onChange={(specs) =>
              onChange({
                specs: Object.keys(specs).length > 0 ? specs : null,
              })
            }
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
                Retailer name
              </span>
              <input
                type="text"
                value={product.retailer_name ?? ""}
                onChange={(e) => onChange({ retailer_name: e.target.value })}
                placeholder="Therabody, Amazon, ..."
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-ink/60 text-xs font-medium uppercase tracking-wider">
                Retailer URL
              </span>
              <input
                type="url"
                value={product.retailer_url ?? ""}
                onChange={(e) => onChange({ retailer_url: e.target.value })}
                placeholder="https://... (paste affiliate link here when you have one)"
                className="border-stone text-ink mt-2 w-full rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ----- String list (pros/cons) --------------------------------------------

function StringList({
  label,
  accent,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  accent: "sage" | "amber";
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const accentText = accent === "sage" ? "text-sage" : "text-amber";
  return (
    <div>
      <p
        className={`${accentText} text-xs font-medium uppercase tracking-wider`}
      >
        {label}
      </p>
      <div className="mt-2 space-y-2">
        {items.map((value, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="border-stone text-ink flex-1 rounded-xl border bg-white px-3 py-2 text-sm focus:border-sage focus:outline-none"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label={`Remove ${label.toLowerCase()} item`}
              className="text-ink/40 hover:text-amber px-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className={`${accentText} mt-2 cursor-pointer text-xs hover:opacity-80`}
      >
        + Add {label.toLowerCase().replace(/s$/, "")}
      </button>
    </div>
  );
}

// ----- Specs editor (key/value) -------------------------------------------

function SpecsEditor({
  specs,
  onChange,
}: {
  specs: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
}) {
  // Stash editing state as an array so users can mutate keys without losing
  // input focus on each keystroke. We sync back to the object on every edit.
  const entries = Object.entries(specs);

  function update(idx: number, k: string, v: string) {
    const next: Record<string, string> = {};
    entries.forEach(([key, val], i) => {
      if (i === idx) {
        if (k.trim()) next[k] = v;
      } else if (key.trim()) {
        next[key] = val;
      }
    });
    onChange(next);
  }

  function addSpec() {
    const next = { ...specs };
    // Find a unique placeholder key
    let i = 1;
    while (next[`Field ${i}`] !== undefined) i++;
    next[`Field ${i}`] = "";
    onChange(next);
  }

  function removeSpec(idx: number) {
    const next: Record<string, string> = {};
    entries.forEach(([key, val], i) => {
      if (i !== idx) next[key] = val;
    });
    onChange(next);
  }

  return (
    <div>
      <p className="text-ink/60 text-xs font-medium uppercase tracking-wider">
        Specs
      </p>
      <p className="text-ink/50 mt-1 text-xs">
        Key/value pairs. Renders as a small specs grid on the public page.
      </p>
      <div className="mt-2 space-y-2">
        {entries.map(([k, v], i) => (
          <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
            <input
              type="text"
              value={k}
              onChange={(e) => update(i, e.target.value, v)}
              placeholder="Key (e.g., Weight)"
              className="border-stone text-ink rounded-xl border bg-white px-3 py-2 text-xs font-medium focus:border-sage focus:outline-none"
            />
            <input
              type="text"
              value={v}
              onChange={(e) => update(i, k, e.target.value)}
              placeholder="Value (e.g., 1.2 kg)"
              className="border-stone text-ink rounded-xl border bg-white px-3 py-2 text-xs focus:border-sage focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeSpec(i)}
              aria-label="Remove spec"
              className="text-ink/40 hover:text-amber px-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addSpec}
        className="text-sage mt-2 cursor-pointer text-xs hover:opacity-80"
      >
        + Add spec
      </button>
    </div>
  );
}

// ----- Save state pill ----------------------------------------------------

function SaveStateLabel({ state }: { state: SaveState }) {
  if (state.kind === "saving") {
    return <span className="text-ink/60 text-xs">Saving...</span>;
  }
  if (state.kind === "error") {
    return <span className="text-amber text-xs">{state.message}</span>;
  }
  if (state.kind === "saved") {
    return <span className="text-sage text-xs">All changes saved</span>;
  }
  return <span className="text-ink/40 text-xs">No changes saved yet</span>;
}
