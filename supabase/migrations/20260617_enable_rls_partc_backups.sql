-- Close the anon door on the four orphaned _partc_*_backup tables flagged by
-- Supabase's `rls_disabled_in_public` security linter.
--
-- These are leftover backups from a past ("part C") migration. They are
-- referenced by zero application code and bypass no app flow, yet — with RLS
-- disabled — they were fully readable (and writable) by anyone holding the
-- public anon key, which ships in the frontend bundle. Two of them hold
-- sensitive data (editor records, subscriber PII).
--
-- Fix: enable RLS with NO policies. Every legitimate access in this app uses the
-- service-role client (which bypasses RLS), and nothing reads these tables
-- anyway, so this needs no policy — it simply denies all anon/authenticated
-- access. Reversible (`disable row level security`) and lossless.

alter table public._partc_articles_dek_backup            enable row level security;
alter table public._partc_editors_backup                 enable row level security;
alter table public._partc_site_settings_backup           enable row level security;
alter table public._partc_subscribers_oldconsent_backup  enable row level security;
