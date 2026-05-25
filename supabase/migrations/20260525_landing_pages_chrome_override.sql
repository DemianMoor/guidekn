-- Adds the "use Guide Kin site chrome" toggle to landing pages, plus an
-- optional auto-revert scheduled for N hours after the toggle is changed.
--
-- Semantics enforced by the app layer (app/lp/[slug]/route.ts +
-- app/api/admin/landing-pages/[slug]/route.ts):
--   * use_site_chrome      = current intent (stripped + replaced at render time)
--   * chrome_revert_to     = value to flip back to when chrome_revert_at passes
--   * chrome_revert_at     = NULL means the setting is permanent
--
-- Revert is enforced lazily on request, so no cron job is required.

alter table public.landing_pages
  add column if not exists use_site_chrome boolean not null default false,
  add column if not exists chrome_revert_to boolean,
  add column if not exists chrome_revert_at timestamptz;

comment on column public.landing_pages.use_site_chrome is
  'When true, the public /lp/<slug> route strips the partner header/footer (best-effort) and injects Guide Kin chrome.';
comment on column public.landing_pages.chrome_revert_to is
  'Value to restore use_site_chrome to once chrome_revert_at passes. NULL means no auto-revert scheduled.';
comment on column public.landing_pages.chrome_revert_at is
  'When the scheduled revert fires. NULL means the current setting is permanent.';
