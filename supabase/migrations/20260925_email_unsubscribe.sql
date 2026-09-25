-- Email-only unsubscribe (signed /unsubscribe links + RFC 8058 one-click).
-- consent_email is set false; SMS consent and status are untouched.
alter table public.subscribers
  add column if not exists email_unsubscribed_at timestamptz;
