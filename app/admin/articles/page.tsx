import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";

export default async function ArticlesPage() {
  const editor = await getCurrentEditor();
  if (!editor) {
    redirect("/admin/signin");
  }

  return (
    <div>
      <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
        Articles
      </p>
      <h1 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        Articles
      </h1>
      <div className="bg-white border-stone mt-8 rounded-2xl border p-10 text-center">
        <p className="text-ink/70">
          The article editor is coming in the next session. Soon you&apos;ll
          be able to draft, edit, and publish from here.
        </p>
      </div>
    </div>
  );
}