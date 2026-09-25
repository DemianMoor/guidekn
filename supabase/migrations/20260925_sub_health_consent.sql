-- /sub-health signup page: subscriber attributes, append-only consent ledger,
-- and a private bucket for rrweb session recordings.

-- 1. Subscriber attributes (all nullable/defaulted; /api/subscribe unaffected)
alter table public.subscribers
  add column if not exists coverage_interests text[] not null default '{}',
  add column if not exists zip text,
  add column if not exists source_params jsonb,
  add column if not exists trustedform_cert_url text,
  add column if not exists last_consent_record_id uuid;

alter table public.subscribers
  add constraint subscribers_coverage_interests_check
    check (coverage_interests <@ array['medicare', 'aca', 'other_healthcare']::text[]),
  add constraint subscribers_zip_check
    check (zip is null or zip ~ '^[0-9]{5}$');

-- 2. Append-only consent ledger
create table public.consent_records (
  id                   uuid primary key,          -- generated in app (part of hash)
  consented_at         timestamptz not null,      -- UTC, set in app (part of hash)
  inserted_at          timestamptz not null default now(),
  form_id              text not null,             -- 'sub-health'
  subscriber_id        uuid,                      -- no FK: subscriber deletes must not be blocked or cascade here
  email                text not null,
  name                 text,
  phone                text,
  zip                  text not null,
  interests            text[] not null,
  consent_email        boolean not null,
  consent_sms          boolean not null,
  consent_version      text not null,
  consent_text         jsonb not null,            -- {email, sms, partners, partners_url} as displayed
  consent_text_sha256  text not null,
  ip_address           text,
  user_agent           text,
  page_url             text,
  referrer             text,
  source_params        jsonb not null default '{}'::jsonb,
  trustedform_cert_url text,
  recording_path       text,
  recording_sha256     text,
  record_hash_version  smallint not null,
  record_sha256        text not null
);
create index consent_records_email_idx on public.consent_records (email);
create index consent_records_consented_at_idx on public.consent_records (consented_at);

create or replace function public.consent_records_block_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'consent_records is append-only (% blocked)', tg_op;
end $$;

create trigger consent_records_no_update_delete
  before update or delete on public.consent_records
  for each row execute function public.consent_records_block_mutation();
create trigger consent_records_no_truncate
  before truncate on public.consent_records
  for each statement execute function public.consent_records_block_mutation();

alter table public.consent_records enable row level security;  -- no policies: service role only
revoke update, delete, truncate on public.consent_records from anon, authenticated, service_role;

-- 3. Private recordings bucket (no storage policies => service role only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('consent-recordings', 'consent-recordings', false, 10485760, array['application/gzip']);
