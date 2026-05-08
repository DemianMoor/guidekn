import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { NewPickForm } from "./new-pick-form";

export const dynamic = "force-dynamic";

export default async function NewPickPage() {
  const editor = await getCurrentEditor();
  if (!editor) redirect("/admin/signin");

  return (
    <div>
      <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
        Picks / New
      </p>
      <h1 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        Start a new round-up.
      </h1>
      <p className="text-ink/70 mt-3 max-w-2xl text-sm">
        Pick a category and a working title. We&apos;ll create a draft and drop
        you into the editor — you can fill in everything else there.
      </p>

      <NewPickForm />
    </div>
  );
}
