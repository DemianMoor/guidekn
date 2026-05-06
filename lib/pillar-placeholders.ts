/**
 * Pillar placeholder images.
 *
 * Each Guide Kin pillar has a designated placeholder image used as the hero
 * visual for any article that does not yet have its own custom hero image.
 *
 * When an article has its own `image_url` set, that takes precedence over
 * the pillar placeholder.
 *
 * To swap a placeholder: replace the URL below and redeploy.
 */

import { PILLARS, type PillarSlug } from "./brand-voice";

const STORAGE_BASE =
  "https://bdhujqomjvfgzbgicwev.supabase.co/storage/v1/object/public/images";

export const PILLAR_PLACEHOLDERS: Record<PillarSlug, string> = {
  body:  `${STORAGE_BASE}/Body.png`,
  mind:  `${STORAGE_BASE}/Mind.png`,
  glow:  `${STORAGE_BASE}/Glow.png`,
  roam:  `${STORAGE_BASE}/Roam.png`,
  bonds: `${STORAGE_BASE}/Bonds.png`,
  years: `${STORAGE_BASE}/Years.png`,
};

export type ArticleImageInfo = {
  url: string;
  alt: string;
  isPlaceholder: boolean;
  pillarLabel: string;
};

/**
 * Resolve the hero image for an article.
 * Returns the article's custom image_url if set, otherwise the pillar placeholder.
 *
 * The `isPlaceholder` flag tells the rendering layer whether to show the
 * pillar-name overlay (only on placeholders, never on custom hero images).
 */
export function getArticleImage(article: {
  image_url?: string | null;
  image_alt?: string | null;
  title?: string | null;
  pillar: string;
}): ArticleImageInfo {
  const pillar = article.pillar.toLowerCase() as PillarSlug;
  const pillarLabel = PILLARS[pillar]?.name ?? "";

  if (article.image_url && article.image_url.trim() !== "") {
    return {
      url: article.image_url,
      alt: article.image_alt || article.title || "",
      isPlaceholder: false,
      pillarLabel,
    };
  }

  return {
    url: PILLAR_PLACEHOLDERS[pillar] ?? PILLAR_PLACEHOLDERS.body,
    alt: pillarLabel,
    isPlaceholder: true,
    pillarLabel,
  };
}