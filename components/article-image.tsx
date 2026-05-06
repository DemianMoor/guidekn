import { getArticleImage } from "@/lib/pillar-placeholders";

type ArticleImageProps = {
  article: {
    title?: string | null;
    image_url?: string | null;
    image_alt?: string | null;
    pillar: string;
  };
  /** Tailwind class controlling the aspect ratio (e.g. 'aspect-[4/3]', 'aspect-[16/9]') */
  aspectClass?: string;
  /** Extra wrapper classes (e.g. rounded corners, borders) */
  className?: string;
};

/**
 * Renders an article's hero image with consistent placeholder fallback behavior.
 *
 * - If the article has a custom image_url, renders that image (no overlay).
 * - If not, renders the pillar's placeholder image as a section card:
 *   white transparent wash over the full image area, with the pillar name
 *   centered as a large amber editorial serif title.
 *
 * The overlay only appears on placeholders. Real hero images stand alone.
 */
export function ArticleImage({
  article,
  aspectClass = "aspect-[4/3]",
  className = "bg-mist border-stone overflow-hidden rounded-2xl border",
}: ArticleImageProps) {
  const { url, alt, isPlaceholder, pillarLabel } = getArticleImage(article);

  return (
    <div className={`relative ${aspectClass} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="h-full w-full object-cover"
      />
      {isPlaceholder && (
        <>
          {/* White transparent wash over the entire image */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-cream/70"
          />
          {/* Centered editorial serif pillar title in amber */}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <h3 className="text-amber font-serif text-4xl font-medium tracking-tight md:text-5xl">
              {pillarLabel}
            </h3>
          </div>
        </>
      )}
    </div>
  );
}