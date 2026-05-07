import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import LandingPagesAdmin from "./landing-pages-admin";

export const dynamic = "force-dynamic";

export default async function LandingPagesPage() {
  const editor = await getCurrentEditor();
  if (!editor) redirect("/admin/signin");

  const supabase = createSupabaseAdmin();
  const { data: pages } = await supabase
    .from("landing_pages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-serif text-ink mb-2">Landing pages</h1>
      <p className="text-ink/70 mb-8">
        Custom partner pages served at /lp/&lt;slug&gt;. Upload a .zip bundle
        (HTML + assets) or a single .html file.
      </p>
      <LandingPagesAdmin pages={pages ?? []} />
    </div>
  );
}
