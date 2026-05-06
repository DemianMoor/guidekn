import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { getSiteSettings } from "@/lib/supabase";
import { SiteImagesForm } from "./site-images-form";

export default async function SiteImagesPage() {
  const editor = await getCurrentEditor();
  if (!editor) {
    redirect("/admin/signin");
  }

  const settings = await getSiteSettings();

  return (
    <div>
      <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
        Site Images & Bio
      </p>
      <h1 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        The visuals that make Guide Kin look like Guide Kin.
      </h1>
      <p className="text-ink/70 mt-3 max-w-2xl text-sm">
        Hero photos for the homepage and About page, plus your founder bio
        and portrait. Changes go live immediately.
      </p>

      <SiteImagesForm initial={settings} />
    </div>
  );
}