import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = [
  // pick-level fields (repeat per row in same round-up; first row wins)
  "pick_category",
  "pick_slug",
  "pick_title",
  "pick_dek",
  "pick_intro_md",
  "pick_methodology_md",
  "pick_byline",
  "pick_pillars",
  "pick_hero_image_url",
  "pick_hero_image_alt",
  "pick_seo_title",
  "pick_seo_description",
  "pick_status",
  "pick_published_at",
  // product-level fields (one row per product)
  "position",
  "badge",
  "name",
  "brand",
  "image_url",
  "image_alt",
  "take",
  "pros",
  "cons",
  "specs",
  "retailer_name",
  "retailer_url",
];

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

const PICK_FIELDS_FOAM = {
  pick_category: "wellness",
  pick_slug: "best-foam-rollers",
  pick_title: "Best foam rollers for adults 40+",
  pick_dek: "Tested for six weeks of post-run recovery and morning mobility.",
  pick_intro_md: `## Why we tested these

Foam rollers all look the same and most of them are. We tested eight popular models for six weeks of recovery work to find the ones worth keeping in the closet.`,
  pick_methodology_md:
    "Each roller was used by two reviewers, three sessions per week, on the same muscle groups, at matched durations. We logged density (Shore-A reading), surface texture wear, and how each held up after 50 sessions.",
  pick_byline: "The Guide Kin team",
  pick_pillars: "body|years",
  pick_hero_image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600",
  pick_hero_image_alt: "A foam roller on a hardwood floor next to a yoga mat",
  pick_seo_title: "Best foam rollers — tested for adults 40+",
  pick_seo_description:
    "Six weeks of recovery sessions on eight popular foam rollers. Three winners — best overall, best budget, best for travel.",
  pick_status: "draft",
  pick_published_at: "",
};

const PICK_FIELDS_KETTLES = {
  pick_category: "travel",
  pick_slug: "travel-kettles",
  pick_title: "Travel kettles worth the suitcase space",
  pick_dek: "What we packed across three trips, and what we'd actually buy.",
  pick_intro_md:
    "If your hotel room coffee is a war crime, you need one of these. We tested four travel kettles across the US, EU, and UK to find the one that earns its weight.",
  pick_methodology_md:
    "Each kettle traveled in a hand carry through TSA and EU security, was used daily for at least six days, and tested with both 110V and 240V power.",
  pick_byline: "The Guide Kin team",
  pick_pillars: "roam",
  pick_hero_image_url: "",
  pick_hero_image_alt: "",
  pick_seo_title: "",
  pick_seo_description: "",
  pick_status: "draft",
  pick_published_at: "",
};

const EXAMPLE_ROWS = [
  // Round-up #1: foam rollers, 2 products
  {
    ...PICK_FIELDS_FOAM,
    position: "0",
    badge: "Best Overall",
    name: "TriggerPoint Grid 2.0",
    brand: "TriggerPoint",
    image_url:
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=900",
    image_alt: "TriggerPoint Grid foam roller on wood floor",
    take: "The textured surface gets into knots without bruising and the hollow core hasn't compressed after eight months of three-times-a-week use. The 13-inch length is the right call for most travel.",
    pros: "Holds up over time|Travel-friendly length|Comfortable density",
    cons: "Pricier than smooth rollers|Texture can grab synthetic clothing",
    specs: "Length=33 cm|Density=Medium-firm|Material=EVA over hollow core",
    retailer_name: "Amazon",
    retailer_url: "https://www.amazon.com/dp/B0040EGNIU",
  },
  {
    ...PICK_FIELDS_FOAM,
    position: "1",
    badge: "Best Budget",
    name: "Amazon Basics High-Density Foam Roller",
    brand: "Amazon Basics",
    image_url: "",
    image_alt: "",
    take: "Surprisingly good for the price. Smooth surface so no surface bruising on first use, and at 36 inches it doubles as a thoracic mobility tool.",
    pros: "Cheap|Long enough for thoracic work|Light",
    cons: "Foam compresses faster than premium rollers",
    specs: "Length=91 cm|Density=Medium|Material=Solid EPP foam",
    retailer_name: "Amazon",
    retailer_url: "https://www.amazon.com/dp/B00XM2MRGI",
  },
  // Round-up #2: travel kettles, 1 product
  {
    ...PICK_FIELDS_KETTLES,
    position: "0",
    badge: "Best Overall",
    name: "Bonavita 0.5L Travel Kettle",
    brand: "Bonavita",
    image_url:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900",
    image_alt: "A small electric travel kettle on a hotel desk",
    take: "Dual voltage actually works. Folds flat-ish, boils 500 ml in about four minutes, and the silicone-handled pour beats every plastic kettle we tried.",
    pros: "True dual voltage|Fast boil time|Silicone handle stays cool",
    cons: "0.5 L is small for two people|US plug only — bring an adapter",
    specs: "Capacity=0.5 L|Voltage=110/220V|Weight=520 g",
    retailer_name: "Bonavita",
    retailer_url: "https://www.bonavita.com",
  },
];

export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lines: string[] = [];
  lines.push(HEADERS.join(","));

  for (const row of EXAMPLE_ROWS) {
    const values = HEADERS.map((h) => {
      const v = (row as Record<string, string>)[h] ?? "";
      return csvEscape(v);
    });
    lines.push(values.join(","));
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="guidekin-picks-template.csv"`,
    },
  });
}
