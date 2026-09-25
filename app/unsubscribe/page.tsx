export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NoSubscribePopup } from "@/lib/popup-context";
import { createSupabaseAdmin } from "@/lib/supabase";
import { unsubscribeEmail, verifyUnsubscribeToken } from "@/lib/unsubscribe";

export const metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

// Unsubscribing happens on the button POST, never on page load: mail
// security scanners open every link in a message automatically.
async function confirmUnsubscribe(formData: FormData) {
  "use server";
  const s = formData.get("s");
  const t = formData.get("t");
  if (!verifyUnsubscribeToken(s, t)) redirect("/unsubscribe");
  await unsubscribeEmail(s);
  redirect(`/unsubscribe?s=${s}&t=${t}&done=1`);
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { s, t, done } = await searchParams;
  const valid = verifyUnsubscribeToken(s, t);
  const subscriber = valid
    ? (
        await createSupabaseAdmin()
          .from("subscribers")
          .select("email, consent_email")
          .eq("id", s)
          .maybeSingle()
      ).data
    : null;
  const unsubscribed = !!subscriber && (done === "1" || !subscriber.consent_email);

  return (
    <>
      <NoSubscribePopup />
      <SiteHeader />
      <main>
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-2xl px-6 py-24 text-center md:py-32">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              Email preferences
            </p>
            {!subscriber ? (
              <>
                <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
                  This link isn&apos;t valid.
                </h1>
                <p className="text-ink/75 mx-auto mt-6 max-w-xl leading-relaxed">
                  Please use the unsubscribe link from one of our emails, or
                  write to hello@guidekn.com and we&apos;ll take care of it.
                </p>
              </>
            ) : unsubscribed ? (
              <>
                <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
                  You&apos;re unsubscribed.
                </h1>
                <p className="text-ink/75 mx-auto mt-6 max-w-xl leading-relaxed">
                  {maskEmail(subscriber.email)}{" "}won&apos;t receive GuideKin
                  emails anymore. This doesn&apos;t affect text messages; reply
                  STOP to any text to stop those.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
                  Unsubscribe from GuideKin emails?
                </h1>
                <p className="text-ink/75 mx-auto mt-6 max-w-xl leading-relaxed">
                  {maskEmail(subscriber.email)}{" "}will stop receiving our emails.
                  Text messages aren&apos;t affected.
                </p>
                <form action={confirmUnsubscribe} className="mt-10">
                  <input type="hidden" name="s" value={s} />
                  <input type="hidden" name="t" value={t} />
                  <button
                    type="submit"
                    className="bg-sage cursor-pointer rounded-full px-7 py-3 text-sm text-white hover:opacity-90"
                  >
                    Unsubscribe from GuideKin emails
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
