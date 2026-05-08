export type PickStatus = "draft" | "published";

export type Pick = {
  id: string;
  slug: string;
  category: string;
  title: string;
  dek: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  intro: string | null;
  methodology: string | null;
  byline: string;
  pillars: string[];
  seo_title: string | null;
  seo_description: string | null;
  status: PickStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_id: string | null;
};

export type PickProduct = {
  id: string;
  pick_id: string;
  position: number;
  badge: string | null;
  name: string;
  brand: string | null;
  image_url: string | null;
  image_alt: string | null;
  take: string;
  pros: string[] | null;
  cons: string[] | null;
  specs: Record<string, string> | null;
  retailer_name: string | null;
  retailer_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PickWithProducts = Pick & {
  products: PickProduct[];
};

// Common badge values for the dropdown in the admin UI
export const COMMON_BADGES = [
  "Best Overall",
  "Best Budget",
  "Best Premium",
  "Best for Beginners",
  "Best for Daily Use",
  "Most Versatile",
  "Editor's Choice",
] as const;
