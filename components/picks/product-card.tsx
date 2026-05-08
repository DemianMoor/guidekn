"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PickProduct } from "@/lib/picks-types";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function ProductCard({
  product,
  index,
  pickSlug,
}: {
  product: PickProduct;
  index: number;
  pickSlug: string;
}) {
  function trackClick() {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "pick_product_click",
      pick_slug: pickSlug,
      product_name: product.name,
      product_brand: product.brand ?? null,
      product_position: product.position,
      retailer: product.retailer_name ?? null,
    });
  }

  return (
    <article className="bg-white border border-stone rounded-2xl overflow-hidden flex flex-col">
      {/* Image */}
      <div className="bg-mist aspect-[4/3]">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.image_alt || product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-ink/40 flex h-full items-center justify-center p-8 text-center text-sm">
            No image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              #{index}
            </span>
            {product.badge && (
              <span className="bg-amber text-cream text-xs font-medium uppercase tracking-wide rounded-full px-3 py-1">
                {product.badge}
              </span>
            )}
          </div>

          {product.brand && (
            <p className="text-ink/60 text-sm mb-1">{product.brand}</p>
          )}

          <h3 className="text-ink font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl">
            {product.name}
          </h3>

          <div className="prose-editorial text-ink/85 mt-4 text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {product.take}
            </ReactMarkdown>
          </div>

          {/* Pros / Cons */}
          {(product.pros?.length || product.cons?.length) && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {product.pros && product.pros.length > 0 && (
                <div>
                  <p className="text-sage text-xs font-medium uppercase tracking-wide mb-2">
                    What we liked
                  </p>
                  <ul className="text-ink/80 text-sm space-y-1">
                    {product.pros.map((pro, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-sage">+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {product.cons && product.cons.length > 0 && (
                <div>
                  <p className="text-amber text-xs font-medium uppercase tracking-wide mb-2">
                    Things to know
                  </p>
                  <ul className="text-ink/80 text-sm space-y-1">
                    {product.cons.map((con, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-amber">−</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="border-l-2 border-stone pl-3">
                  <dt className="text-ink/60 text-xs uppercase tracking-wide">
                    {k}
                  </dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Retailer button */}
          {product.retailer_url && (
            <div className="mt-6">
              <a
                href={product.retailer_url}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                onClick={trackClick}
                className="bg-sage text-cream inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition"
              >
                {product.retailer_name
                  ? `View at ${product.retailer_name}`
                  : "View product"}
                <span aria-hidden>→</span>
              </a>
              <p className="text-ink/40 text-xs mt-2">
                Links may include affiliate codes. We only recommend what
                we&apos;d buy ourselves.
              </p>
            </div>
          )}
      </div>
    </article>
  );
}
