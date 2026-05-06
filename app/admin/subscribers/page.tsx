import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

const PILLAR_NAMES: Record<string, string> = {
  body: "Body",
  mind: "Mind",
  glow: "Glow",
  roam: "Roam",
  bonds: "Bonds",
  years: "Years",
};

export default async function SubscribersPage() {
  const editor = await getCurrentEditor();
  if (!editor) {
    redirect("/admin/signin");
  }

  const supabase = createSupabaseAdmin();

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
        Subscribers
      </p>
      <h1 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        Your kin.
      </h1>
      <p className="text-ink/70 mt-3 text-sm">
        Everyone who&apos;s signed up to hear from Guide Kin.{" "}
        {subscribers && (
          <span>
            Total: <strong>{subscribers.length}</strong>
          </span>
        )}
      </p>

      {error && (
        <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-4 text-sm text-ink">
          Couldn&apos;t load subscribers: {error.message}
        </div>
      )}

      {subscribers && subscribers.length === 0 && (
        <div className="bg-white border-stone mt-8 rounded-2xl border p-10 text-center">
          <p className="text-ink/70">
            No subscribers yet. Once people start subscribing, they&apos;ll
            show up here.
          </p>
        </div>
      )}

      {subscribers && subscribers.length > 0 && (
        <div className="bg-white border-stone mt-8 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-mist border-stone border-b">
              <tr className="text-ink/70 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Pillars</th>
                <th className="px-4 py-3 font-medium">Channels</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-stone border-b last:border-0">
                  <td className="text-ink px-4 py-3">{s.name}</td>
                  <td className="text-ink/80 px-4 py-3 text-xs">{s.email}</td>
                  <td className="text-ink/60 px-4 py-3 text-xs">
                    {s.phone || "—"}
                  </td>
                  <td className="text-ink/70 px-4 py-3 text-xs">
                    {(s.pillars as string[])
                      .map((p) => PILLAR_NAMES[p] || p)
                      .join(", ") || "—"}
                  </td>
                  <td className="text-ink/70 px-4 py-3 text-xs">
                    {[
                      s.consent_email && "Email",
                      s.consent_sms && "SMS",
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>
                  <td className="text-ink/60 px-4 py-3 text-xs">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-ink/70 px-4 py-3 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        s.status === "active"
                          ? "bg-mist text-sage"
                          : "bg-stone text-ink/60"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}