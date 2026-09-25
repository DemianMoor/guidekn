# CLAUDE.md — Guide Kin operational reference

> **What this file is.** The operational source of truth for working in this repo: what's shipped, where things live, how to deploy, what'll bite you. Last re-audited **2026-09-25**.
>
> **What this file is NOT.** PROJECT_CONTEXT.md (kept outside this repo) is the strategic source of truth (the "why and what"). When the two conflict, the code wins — and the discrepancy should be flagged here.
>
> **Hard rule** from [AGENTS.md](AGENTS.md): this is **NOT** the Next.js you know. Read `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

## 1. Project identity (condensed)

- **Product:** Free editorial publication for adults 35+, US-targeted, operated from Poland.
- **Legal entity:** Yelow Sp. z o.o. — **Domain:** guidekn.com — **Contact:** hello@guidekn.com
- **Tagline:** "Guidance from people who get it." Subscribers = **kin**, never "users."
- **Six pillars:** `body` · `mind` · `glow` · `roam` · `bonds` · `years` — each is a top-level URL segment.
- **Voice rules (absolute, enforced in [lib/brand-voice.ts](lib/brand-voice.ts)):** no exclamation marks, no ALL CAPS for emphasis, no emoji unless explicitly requested, banned words ("elderly," "senior" as noun, "anti-aging," "defy aging," "geriatric," "for your age," "over the hill").
- **Visual:** Source Serif 4 (editorial) + Inter (UI), self-hosted via `next/font`. Palette: sage `#0F6E56`, amber `#BA7517`, ink `#2C2C2A`, cream `#FAF8F3`, mist `#E1F5EE`, stone `#D3D1C7`.

---

## 2. What this repo is (and isn't)

**This repo is the public site only.** The in-repo admin (`app/admin/**`, `app/api/admin/**`, the publish cron, `lib/admin-auth.ts`) was removed on 2026-06-09 (commit `80816ee`). Content — articles, picks, landing pages, site settings, legal pages, subscribers view — is managed from the **central admin at admin.guidekn.com**, a separate codebase that reads/writes this repo's Supabase project. Scheduled publishing is done by the central admin's cron (`vercel.json` has no crons).

Do not re-add admin routes here.

## 3. Architecture stack

| Layer | Choice | Verified in |
|---|---|---|
| Framework | Next.js **16.2.4** (App Router, RSC, TypeScript) | [package.json](package.json) |
| React | **19.2.4** | [package.json](package.json) |
| Bundler | **Webpack** (`next dev --webpack`) — NOT Turbopack | [package.json](package.json) |
| Styling | Tailwind CSS **v4** | [package.json](package.json) |
| Database + Storage | Supabase (Postgres) — project `bdhujqomjvfgzbgicwev` | [lib/supabase.ts](lib/supabase.ts) |
| DB access | `@supabase/supabase-js` + `@supabase/ssr`, no ORM | [lib/supabase.ts](lib/supabase.ts) |
| Email | Resend + React Email (welcome email on `/subscribe`) | [app/api/subscribe/route.ts](app/api/subscribe/route.ts) |
| Session recording (consent proof) | `rrweb` (self-hosted, `/sub-health` only) | [app/sub-health/sub-health-form.tsx](app/sub-health/sub-health-form.tsx) |
| Consent certification | TrustedForm Certify (`/sub-health` only, env-gated) | [lib/trustedform.ts](lib/trustedform.ts) |
| Hosting | Vercel — auto-deploy from `main` | — |
| DNS / CDN / WAF | Cloudflare (proxied) | external |
| Analytics | GTM → GA4 + Clarity, IDs from `site_settings.analytics_*` with hardcoded fallback; Keitaro on SMS-direct visits (`sub_id_5`) | [components/analytics.tsx](components/analytics.tsx), [components/keitaro.tsx](components/keitaro.tsx) |

### Gotchas

1. **Use webpack, not Turbopack.** `npm run dev` already uses `--webpack`.
2. **Use `proxy.ts`, not `middleware.ts`.** [proxy.ts](proxy.ts) refreshes Supabase auth sessions.
3. **`next/headers` is dynamically imported** inside [lib/supabase.ts](lib/supabase.ts) so client components don't pull it in.
4. **Clear `.next` after creating any new API route**, then restart dev: `Remove-Item -Recurse -Force .next`
5. **No literal pillar folders.** `app/` has only `[pillar]`. Static routes (`/subscribe`, `/sub-health`, `/partners`, `/about`, `/picks`) take precedence over it.
6. **Article hero images always render through `<ArticleImage>`** from [components/article-image.tsx](components/article-image.tsx).
7. **PowerShell square-bracket gotcha.** For paths like `app/[pillar]/page.tsx`, use `-LiteralPath` or backtick-escape the brackets.
8. **`guidekin-schema-dump.sql` is stale** (2026-06-08; still shows the old `consent_*_at`/`consent_ip` subscriber columns). Query the live DB for the current schema.

---

## 4. Feature status

Legend: ✅ Shipped · 🟡 Partial · ⛔ Blocked · ⏸ Deferred

| Feature | Code | Status | Notes |
|---|---|---|---|
| Homepage, pillar pages, article reading | [app/page.tsx](app/page.tsx), [app/[pillar]/](app/[pillar]/) | ✅ | |
| Public picks (round-ups) | [app/picks/](app/picks/), [components/picks/](components/picks/) | ✅ | `pick_product_click` dataLayer event |
| Subscribe page + popup | [app/subscribe/page.tsx](app/subscribe/page.tsx), [components/subscribe-popup.tsx](components/subscribe-popup.tsx), [app/api/subscribe/route.ts](app/api/subscribe/route.ts) | ✅ | Upserts `subscribers` on email; sends welcome email on email consent |
| Health-coverage signup (`/sub-health`) | [app/sub-health/](app/sub-health/), [app/api/sub-health/route.ts](app/api/sub-health/route.ts), [lib/consent/](lib/consent/) | ✅ | Partner-traffic page. Interests `medicare`/`aca`/`other_healthcare`, ZIP, all query params → `subscribers`. Every submission writes an append-only `consent_records` row (consent text + version + SHA-256, IP, UA, page URL, referrer, rrweb recording path + hash, TrustedForm cert, whole-record SHA-256). No welcome email. |
| Email unsubscribe | [app/unsubscribe/page.tsx](app/unsubscribe/page.tsx), [app/api/unsubscribe/route.ts](app/api/unsubscribe/route.ts), [lib/unsubscribe.ts](lib/unsubscribe.ts) | ✅ | Signed per-subscriber links (HMAC, no expiry) in the welcome and /sub-health confirmation emails, plus RFC 8058 `List-Unsubscribe` / `List-Unsubscribe-Post` headers. Unsubscribes on the button POST, never on GET (mail scanners). Email only: sets `consent_email=false` + `email_unsubscribed_at`; SMS consent, `status`, and `consent_records` untouched. |
| Marketing partners page | [app/partners/page.tsx](app/partners/page.tsx) | ✅ | Renders the partner list of the current consent version |
| Legal pages | [app/privacy/](app/privacy/), [app/terms/](app/terms/), [components/legal-page.tsx](components/legal-page.tsx) | ✅ | Rendered from the `legal_pages` table |
| Landing pages (`/lp/[slug]`) | [app/lp/[slug]/route.ts](app/lp/%5Bslug%5D/route.ts), [lib/landing-page-chrome.ts](lib/landing-page-chrome.ts), [lib/tracking-rewrite.ts](lib/tracking-rewrite.ts), [lib/lp-check-preview.ts](lib/lp-check-preview.ts) | ✅ | Raw HTML from the `landing-pages` bucket; asset rewrite, GTM/Clarity/Keitaro inject, optional site-chrome swap, tracking-URL rewrite, signed `?lpcheck=` preview for inactive pages |
| Bot blocking + robots.txt | [public/robots.txt](public/robots.txt) + Cloudflare WAF | ✅ | |
| "Related picks" on pillar pages | — | 🟡 | Spec'd in PROJECT_CONTEXT.md, not built; only intra-picks related picks exist |
| AI voice deflection / Twilio SMS | — | ⛔ | Awaiting Twilio verification |
| Geo-restriction, Cloudflare Access, multi-site, digest automation | — | ⏸ | |

---

## 5. Consent-proof system (`/sub-health`)

- **Consent copy** lives in [lib/consent/sub-health.ts](lib/consent/sub-health.ts), keyed by version ID. Never edit a published version; add a new one and move `CURRENT_SUB_HEALTH_CONSENT_VERSION`. The partner list shown on `/partners` is part of the version.
- **`consent_records`** is append-only: DB triggers reject UPDATE/DELETE/TRUNCATE; RLS on with no policies (service role only).
- **Hash v1:** `record_sha256 = sha256(canonicalJson(row without record_sha256 and inserted_at))`, `consented_at` as ISO-8601 UTC. `canonicalJson` = [lib/consent/hash.ts](lib/consent/hash.ts) (recursively sorted keys).
- **Recordings:** rrweb JSON, gzipped, in the private `consent-recordings` bucket at `sub-health/YYYY/MM/<record_id>.json.gz`; all typed input values masked, checkbox states kept. A missing/failed recording doesn't block the signup (`recording_path` null).
- **TrustedForm:** `TRUSTEDFORM_ENABLED=true` loads the Certify script (tagged consent) on `/sub-health` only; the server stores `xxTrustedFormCertUrl` only if it is an `https://cert.trustedform.com/...` URL.

---

## 6. File map (load-bearing files)

- [proxy.ts](proxy.ts) — Supabase session refresher (Next 16 successor to `middleware.ts`)
- [next.config.ts](next.config.ts) — image `remotePatterns` for Supabase Storage
- [lib/brand-voice.ts](lib/brand-voice.ts) — voice rules, `PILLARS`, AI prompt builders
- [lib/supabase.ts](lib/supabase.ts) — browser / server / admin clients, `getSiteSettings()`, `getAnalyticsSettings()`
- [lib/popup-context.tsx](lib/popup-context.tsx) — `<NoSubscribePopup />` opt-out
- [components/subscribe/form-parts.tsx](components/subscribe/form-parts.tsx) — shared form building blocks for `/subscribe` and `/sub-health`
- [components/site-header.tsx](components/site-header.tsx), [components/site-footer.tsx](components/site-footer.tsx) — public chrome; [lib/site-chrome-html.ts](lib/site-chrome-html.ts) is a hand-kept plain-HTML mirror for landing pages
- [app/layout.tsx](app/layout.tsx) — fonts, analytics, Keitaro, popup
- [app/auth/callback/route.ts](app/auth/callback/route.ts) — Supabase code exchange
- [emails/welcome-email.tsx](emails/welcome-email.tsx) — welcome email template

---

## 7. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_ADDRESS=            # e.g. "Guide Kin <hello@guidekn.com>"
NEXT_PUBLIC_GTM_ID=             # fallback; site_settings.analytics_* wins
TRUSTEDFORM_ENABLED=            # "true" to load TrustedForm on /sub-health
UNSUBSCRIBE_SECRET=             # HMAC key for signed /unsubscribe links; rotating it breaks links in sent emails
```

`.env.local` is git-ignored; production values live in Vercel project env. Never paste keys into chat or commit them.

---

## 8. Workflow

```powershell
Remove-Item -Recurse -Force .next     # esp. after adding API routes
npm run dev                            # webpack
```

Ship: `git add <specific files>`, commit, `git push` — Vercel auto-deploys `main`.

---

## 9. Open follow-ups

1. **`/api/subscribe` upsert overwrites existing rows.** Re-subscribing replaces `pillars` and the consent flags — including turning off `consent_sms` previously granted on `/sub-health`. `/api/sub-health` merges instead; `/api/subscribe` should too.
2. **`subscribers.source` is never written by `/api/subscribe`** — the popup sends `source: "popup"` but the route only logs it.
3. **Console noise in `/api/subscribe`** — emoji-prefixed `console.log` lines and a Resend key-prefix log.
4. **PROJECT_CONTEXT.md is behind:** admin auth, admin location (central admin), site settings, "Related picks" claim.
