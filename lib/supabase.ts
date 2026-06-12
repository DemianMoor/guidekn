import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * For Client Components (browser-side).
 * Used in any file that has "use client" at the top.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * For Server Components and Route Handlers.
 * Reads/writes auth cookies so the user's session is available server-side.
 */
export async function createSupabaseServerClient() {
  // Dynamic import so client components don't pull in next/headers
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore
            // since middleware refreshes sessions.
          }
        },
      },
    }
  );
}

/**
 * Admin client — uses the service role key.
 * SERVER-SIDE ONLY. Never import from a client component.
 * Bypasses Row Level Security. Use sparingly.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase environment variables are not set. Check .env.local."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
/**
 * Coerce a raw site_settings value to a string.
 *
 * `site_settings.value` is a `text` column today but is planned to become
 * `jsonb`. supabase-js returns a jsonb column already-decoded, so a stored JSON
 * string still arrives as a JS string (this is then a no-op); any non-string
 * jsonb (object/number/bool) is coerced to a string rather than leaking
 * `[object Object]` into the UI. Works under BOTH column types.
 */
export function coerceSettingValue(value: unknown): string {
  return typeof value === "string" ? value : String(value);
}

/**
 * Build a key→string map from raw site_settings rows, tolerant of `value` being
 * text (today) or jsonb (after the flip). Null/empty values are skipped,
 * matching the previous truthiness behaviour.
 */
export function toSettingsMap(
  rows: { key: string; value: unknown }[] | null | undefined
): Record<string, string> {
  const settings: Record<string, string> = {};
  if (!rows) return settings;
  for (const row of rows) {
    if (row.value === null || row.value === undefined) continue;
    const value = coerceSettingValue(row.value);
    if (value) settings[row.key] = value;
  }
  return settings;
}

/**
 * Fetch all site settings as a key-value map.
 * Used by marketing pages to get current hero images, bios, etc.
 */
export async function getSiteSettings(): Promise<Record<string, string>> {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase.from("site_settings").select("key, value");
  return toSettingsMap(data);
}

/**
 * Hardcoded analytics fallbacks — the values GuideKin shipped before analytics
 * moved into site_settings. Kept so a missing/empty row (or a fetch failure)
 * can't blank analytics mid-migration. Stage 3 cleanup removes these.
 */
const ANALYTICS_FALLBACK = {
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? "",
  ga4Id: "G-9CH0Q12QQK",
  clarityId: "wnchg7ymtb",
};

/**
 * Resolve the site-wide analytics IDs from site_settings, with the previous
 * hardcoded values as a fallback. Single source of truth, wired into the root
 * layout (GTM) and the /lp handler (GTM + Clarity).
 *
 * Note: on GuideKin, GA4 and Clarity are delivered *through* the GTM container,
 * so only the GTM id is injected on the main site (injecting GA4/Clarity again
 * would double-count). `ga4Id` is resolved here for a single source of truth and
 * for the later step that retires the GTM-side tags; it is not separately
 * injected today. Never throws: any fetch failure falls back to the defaults.
 */
export async function getAnalyticsSettings(): Promise<{
  gtmId: string;
  ga4Id: string;
  clarityId: string;
  keitaroScript: string;
}> {
  let settings: Record<string, string> = {};
  try {
    settings = await getSiteSettings();
  } catch {
    // Network/env failure — fall through to hardcoded fallbacks below.
  }
  return {
    gtmId: settings.analytics_gtm_id || ANALYTICS_FALLBACK.gtmId,
    ga4Id: settings.analytics_ga4_id || ANALYTICS_FALLBACK.ga4Id,
    clarityId: settings.analytics_clarity_id || ANALYTICS_FALLBACK.clarityId,
    // Direct-mode Keitaro capture. No fallback: blank/absent → inject nothing.
    keitaroScript: settings.keitaro_tracking_script || "",
  };
}