# CLAUDE.md — Guide Kin operational reference

> **What this file is.** The operational source of truth for working in this repo: what's shipped, what's spec'd, where things live, how to deploy, what'll bite you. Derived from [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) + a full audit of the codebase on **2026-05-18**.
>
> **What this file is NOT.** PROJECT_CONTEXT.md is the strategic/decisional source of truth (the "why and what"). This file is the operational/factual source of truth (the "how and where, as it actually exists"). When the two conflict, the code wins — and the discrepancy should be flagged here.
>
> **Hard rule** from [AGENTS.md](AGENTS.md): this is **NOT** the Next.js you know. Read `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

## 1. Project identity (condensed)

- **Product:** Free editorial publication for adults 35+, US-targeted, operated from Poland.
- **Legal entity:** Yelow Sp. z o.o. — **Domain:** guidekn.com — **Contact:** hello@guidekn.com
- **Tagline:** "Guidance from people who get it." Subscribers = **kin**, never "users."
- **Six pillars:** `body` · `mind` · `glow` · `roam` · `bonds` · `years` — each is a top-level URL segment.
- **Voice rules (absolute, enforced in [lib/brand-voice.ts](lib/brand-voice.ts)):** no exclamation marks, no ALL CAPS for emphasis, no emoji unless explicitly requested, banned words ("elderly," "senior" as noun, "anti-aging," "defy aging," "geriatric," "for your age," "over the hill").
- **Visual:** Source Serif 4 (editorial) + Inter (UI). Palette: sage `#0F6E56`, amber `#BA7517`, ink `#2C2C2A`, cream `#FAF8F3`, mist `#E1F5EE`, stone `#D3D1C7`.

See [PROJECT_CONTEXT.md §1](PROJECT_CONTEXT.md) for full brand context.

---

## 2. Architecture stack

| Layer | Choice | Verified in |
|---|---|---|
| Framework | Next.js **16.2.4** (App Router, RSC, TypeScript) | [package.json](package.json) |
| React | **19.2.4** | [package.json](package.json) |
| Bundler | **Webpack** (`next dev --webpack`) — NOT Turbopack | [package.json:6](package.json#L6) |
| Styling | Tailwind CSS **v4** | [package.json](package.json) |
| Database + Storage | Supabase (Postgres) — project `bdhujqomjvfgzbgicwev` | [lib/supabase.ts](lib/supabase.ts) |
| ORM | Direct `@supabase/supabase-js` + `@supabase/ssr` — no separate ORM | [lib/supabase.ts](lib/supabase.ts) |
| Email | Resend + React Email | [app/api/subscribe/route.ts](app/api/subscribe/route.ts), [emails/welcome-email.tsx](emails/welcome-email.tsx) |
| AI SDKs (admin drafting) | `@anthropic-ai/sdk`, `@ai-sdk/anthropic`, `ai` | [package.json](package.json), [app/api/admin/articles/draft/route.ts](app/api/admin/articles/draft/route.ts) |
| Drag-and-drop (picks editor) | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | [package.json](package.json) |
| Zip handling (landing pages) | `jszip` | [package.json](package.json) |
| CSV parsing (bulk imports) | `papaparse` | [package.json](package.json) |
| Images | `sharp` | [package.json](package.json) |
| Hosting | Vercel — auto-deploy from `main` | [vercel.json](vercel.json) |
| DNS / CDN / WAF | Cloudflare (proxied), domain guidekn.com | Cloudflare dashboard (external) |
| Analytics | GTM `GTM-WZCLJWBM` → GA4 `G-9CH0Q12QQK` + Clarity `wnchg7ymtb` | [components/analytics.tsx](components/analytics.tsx) |
| Auth (admin) | Supabase Auth — **password (primary) with email OTP toggle** + reset flow | [app/admin/signin/page.tsx](app/admin/signin/page.tsx), [lib/admin-auth.ts](lib/admin-auth.ts) |

### Gotchas (verified live as of 2026-05-18)

1. **Use webpack, not Turbopack.** ✅ `npm run dev` already uses `--webpack`.
2. **Use `proxy.ts`, not `middleware.ts`.** ✅ [proxy.ts](proxy.ts) exists at the repo root; it refreshes Supabase auth sessions on every non-`/api/_next/asset` route.
3. **`next/headers` is dynamically imported** inside [lib/supabase.ts:21](lib/supabase.ts#L21) so client components don't pull it in.
4. **Clear `.next` after creating any new API route**, then restart dev: `Remove-Item -Recurse -Force .next`
5. **No literal pillar folders.** ✅ `app/` contains only `[pillar]` — no `body/`, `mind/`, etc. Do not recreate them.
6. **All file pastes must be COMPLETE.** Partial paste silently mixes old and new code. Ctrl+A → Delete → confirm empty → paste → Ctrl+S.
7. **Article hero images always render through `<ArticleImage>`** from [components/article-image.tsx](components/article-image.tsx). ✅ Used in [app/page.tsx](app/page.tsx), [app/[pillar]/page.tsx](app/[pillar]/page.tsx), [app/[pillar]/[slug]/page.tsx](app/[pillar]/[slug]/page.tsx). Picks have their own image patterns ([components/picks/](components/picks/)) — that's intentional, not a regression.
8. **PowerShell square-bracket gotcha.** To open files like `app/[pillar]/page.tsx`, use `-LiteralPath` or backtick-escape the brackets.

---

## 3. Feature implementation status

Legend: ✅ Shipped · 🟡 Spec exists, partial code · 📐 Spec only · ⛔ Blocked · ⏸ Deferred

| # | Feature | Spec | Code | Status | Last verified | Notes |
|---|---|---|---|---|---|---|
| 1 | Public homepage, pillar pages, article reading | — | [app/page.tsx](app/page.tsx), [app/[pillar]/](app/[pillar]/) | ✅ | 2026-05-18 | Uses `<ArticleImage>` everywhere |
| 2 | Articles admin (auth, editor, publish) | — | [app/admin/articles/](app/admin/articles/), [app/api/admin/articles/](app/api/admin/articles/) | ✅ | 2026-05-18 | Includes AI draft route [app/api/admin/articles/draft/route.ts](app/api/admin/articles/draft/route.ts) |
| 3 | Subscriber capture (TCPA-compliant) | — | [app/api/subscribe/route.ts](app/api/subscribe/route.ts), [app/subscribe/page.tsx](app/subscribe/page.tsx) | ✅ | 2026-05-18 | Stores email/SMS consent timestamps + IP + UA |
| 4 | Welcome email (Resend) | — | [emails/welcome-email.tsx](emails/welcome-email.tsx), [app/api/subscribe/route.ts](app/api/subscribe/route.ts) | ✅ | 2026-05-18 | Sent on email-consented signup |
| 5 | Daily 6 AM UTC cron — publish scheduled articles | — | [app/api/cron/publish-scheduled/route.ts](app/api/cron/publish-scheduled/route.ts), [vercel.json](vercel.json) | ✅ | 2026-05-18 | Protected by `CRON_SECRET` |
| 6 | 20 backdated articles across 6 pillars | — | (data only — in Supabase) | ✅ | 2026-05-18 | See [PROJECT_CONTEXT.md §5](PROJECT_CONTEXT.md) for inventory |
| 7 | Pillar placeholder image system + section-card overlay | — | [lib/pillar-placeholders.ts](lib/pillar-placeholders.ts), [components/article-image.tsx](components/article-image.tsx) | ✅ | 2026-05-18 | Cream/70 wash + amber Source Serif title |
| 8 | Bulk CSV import for articles | — | [app/admin/articles/import/](app/admin/articles/import/), [app/api/admin/articles/import/](app/api/admin/articles/import/) | ✅ | 2026-05-18 | Template download endpoint included |
| 9 | Subscribe popup (5s timer, session-scoped) | — | [components/subscribe-popup.tsx](components/subscribe-popup.tsx), [lib/popup-context.tsx](lib/popup-context.tsx) | ✅ | 2026-05-18 | `<NoSubscribePopup />` for opt-out; excludes `/admin/*`, `/auth/*`, `/api/*`, `/subscribe` |
| 10 | GA4 + Clarity via GTM | — | [components/analytics.tsx](components/analytics.tsx) | ✅ | 2026-05-18 | Skips `/admin/*`; client-side `page_view` via `PageViewTracker` |
| 11 | Cloudflare bot blocking + robots.txt | — | [public/robots.txt](public/robots.txt) (+ Cloudflare WAF rules off-repo) | ✅ | 2026-05-18 | `Disallow: /` for major AI crawlers + global wildcard |
| 12 | Landing pages system (zip upload, raw HTML serve, GTM inject) | LANDING_PAGES_SPEC.md (external) | [app/lp/[slug]/route.ts](app/lp/%5Bslug%5D/route.ts), [app/admin/landing-pages/](app/admin/landing-pages/), [app/api/admin/landing-pages/](app/api/admin/landing-pages/) | ✅ | 2026-05-18 | Supabase Storage `landing-pages` bucket; regex-based asset path rewrite (documented limit: dynamically-built URLs not rewritten) |
| 13 | Picks (round-ups) — public pages + admin CMS | PICKS_SPEC.md (external) | [app/picks/](app/picks/), [app/admin/picks/](app/admin/picks/), [app/api/admin/picks/](app/api/admin/picks/) | ✅ | 2026-05-18 | Drag-to-reorder products (dnd-kit). `pick_product_click` dataLayer event in [components/picks/product-card.tsx:22](components/picks/product-card.tsx#L22). Bulk publish/unpublish/delete in [app/api/admin/picks/bulk/route.ts](app/api/admin/picks/bulk/route.ts). Bulk CSV import in [app/admin/picks/import/](app/admin/picks/import/). |
| 14 | "Related picks" on pillar pages (spec'd cross-linking) | PICKS_SPEC.md | — | 🟡 | 2026-05-18 | **DISCREPANCY** — pillar page has no Related picks section. Related picks exist only **inside** [app/picks/[category]/[slug]/page.tsx:172](app/picks/%5Bcategory%5D/%5Bslug%5D/page.tsx#L172) (intra-picks). See §7. |
| 15 | Site settings (key/value) + Site images admin | — | [app/admin/site-images/](app/admin/site-images/), [app/api/admin/site-settings/route.ts](app/api/admin/site-settings/route.ts), [lib/supabase.ts:73 `getSiteSettings`](lib/supabase.ts#L73) | ✅ | 2026-05-18 | **Undocumented in PROJECT_CONTEXT.md.** Marketing pages can fetch dynamic settings from `site_settings` table. |
| 16 | Article hero image upload (admin) | — | [app/api/admin/articles/images/upload/route.ts](app/api/admin/articles/images/upload/route.ts), [app/api/admin/images/upload/route.ts](app/api/admin/images/upload/route.ts) | ✅ | 2026-05-18 | Two upload endpoints — generic + article-scoped |
| 17 | AI voice deflection (Twilio + Vapi) | VOICE_DEFLECTION_SPEC.md | — | ⛔ | 2026-05-18 | Awaiting Twilio business verification. No `/api/voice/*` route, no `call_records` table, no `/admin/calls` page. |
| 18 | SMS via Twilio (A2P 10DLC) | — | — | ⛔ | 2026-05-18 | Same Twilio blocker |
| 19 | Geo-restriction (US/CA/MX) | — | — | ⏸ | 2026-05-18 | Phased — bots first, geo later |
| 20 | Cloudflare Access (Zero Trust) | — | — | ⏸ | 2026-05-18 | Tied to geo phase |
| 21 | Anthropic API for in-admin drafting | — | [app/api/admin/articles/draft/route.ts](app/api/admin/articles/draft/route.ts), [package.json](package.json) | 🟡 | 2026-05-18 | PROJECT_CONTEXT.md says "Account was suspended at some point; status unclear" — but `ANTHROPIC_API_KEY` is set in `.env.local` and AI SDKs are installed. **Verify the key works before assuming the draft feature is dead.** |
| 22 | Multi-site / monorepo | — | — | ⏸ | 2026-05-18 | Do not introduce `site_id` columns or shared packages yet |
| 23 | Real photos for top articles | — | — | ⏸ | 2026-05-18 | Polish |
| 24 | Sunday digest email automation | — | — | ⏸ | 2026-05-18 | Resend already configured; needs scheduler + template |
| 25 | Mobile QA pass | — | — | ⏸ | 2026-05-18 | Pre-launch |
| 26 | Landing pages: site-chrome override | — | [app/lp/[slug]/route.ts](app/lp/%5Bslug%5D/route.ts), [lib/landing-page-chrome.ts](lib/landing-page-chrome.ts), [lib/site-chrome-html.ts](lib/site-chrome-html.ts), [app/admin/landing-pages/[slug]/chrome-settings.tsx](app/admin/landing-pages/%5Bslug%5D/chrome-settings.tsx), [app/api/admin/landing-pages/[slug]/chrome-check/route.ts](app/api/admin/landing-pages/%5Bslug%5D/chrome-check/route.ts) | ✅ | 2026-05-25 | Per-page admin toggle that swaps the partner header, footer **and favicon** for Guide Kin's (one combined toggle — no separate controls). Optional N-hour auto-revert dropdown (1h-7d, or permanent); revert is enforced lazily on each request — no cron. Best-effort partner-chrome detection via heuristic chain (semantic tag → id/class hints → top-level `<nav>`). Favicon swap strips all `<link rel="icon\|shortcut\|apple-touch-icon\|mask-icon\|manifest">` tags from `<head>` and injects `/icon.svg` + `/apple-icon.svg`. When toggle is ON, Guide Kin chrome (header, footer, favicon) is **always** injected regardless of detection success; preflight check at save-time warns the editor only for header/footer (favicon swap is silent — always safe). Adds `node-html-parser` dep. Migration: `supabase/migrations/20260525_landing_pages_chrome_override.sql` (columns `use_site_chrome`, `chrome_revert_to`, `chrome_revert_at` on `landing_pages`). Plain-HTML site chrome in [lib/site-chrome-html.ts](lib/site-chrome-html.ts) is a hand-maintained mirror of [components/site-header.tsx](components/site-header.tsx) / [components/site-footer.tsx](components/site-footer.tsx) — keep visually in sync. |

---

## 4. File map (load-bearing files only)

### Config / infra
- [next.config.ts](next.config.ts) — empty Next config (defaults)
- [tsconfig.json](tsconfig.json) — `@/*` alias = repo root, strict on
- [proxy.ts](proxy.ts) — Supabase session refresher for non-API routes (Next 16 successor to `middleware.ts`)
- [vercel.json](vercel.json) — defines the 6 AM UTC cron at `/api/cron/publish-scheduled`
- [public/robots.txt](public/robots.txt) — full disallow, including AI crawlers

### lib (shared)
- [lib/brand-voice.ts](lib/brand-voice.ts) — authoritative voice rules, `PILLARS` constant, `BRAND_SYSTEM_PROMPT`, AI prompt builders. **Source of truth for any AI generation.**
- [lib/pillar-placeholders.ts](lib/pillar-placeholders.ts) — `PILLAR_PLACEHOLDERS` URL map + `getArticleImage()` resolver
- [lib/supabase.ts](lib/supabase.ts) — three client factories (browser / server / admin) + `getSiteSettings()`
- [lib/admin-auth.ts](lib/admin-auth.ts) — `getCurrentEditor()` — gatekeeper for all admin pages; cross-checks Supabase Auth user against `editors` table
- [lib/popup-context.tsx](lib/popup-context.tsx) — `PopupProvider` + `<NoSubscribePopup />` opt-out
- [lib/picks-types.ts](lib/picks-types.ts) — `Pick`, `PickProduct`, `PickWithProducts` types + `COMMON_BADGES` constant
- [lib/site-chrome-html.ts](lib/site-chrome-html.ts) — plain-HTML mirror of `<SiteHeader/>` + `<SiteFooter/>` for injection into landing pages (no Tailwind/Next runtime on the partner page)
- [lib/landing-page-chrome.ts](lib/landing-page-chrome.ts) — `effectiveChromeState()` (lazy revert), `detectChrome()` (preflight), `applyChromeSwap()` (strip partner chrome + inject Guide Kin's)

### Components (public)
- [components/article-image.tsx](components/article-image.tsx) — **MANDATORY for any article hero/card image**. Renders custom hero or pillar placeholder with overlay.
- [components/site-header.tsx](components/site-header.tsx), [components/site-footer.tsx](components/site-footer.tsx) — public chrome. Footer has tel link + Yelow attribution.
- [components/subscribe-popup.tsx](components/subscribe-popup.tsx) — session-scoped popup with foreground-pause timer
- [components/analytics.tsx](components/analytics.tsx) — GTM loader + `PageViewTracker` (RSC route-change tracking)
- [components/picks/pick-hero-card.tsx](components/picks/pick-hero-card.tsx), [components/picks/product-card.tsx](components/picks/product-card.tsx) — pick rendering; product card fires `pick_product_click` dataLayer events

### App routes — public
- [app/layout.tsx](app/layout.tsx) — root layout, font loading, popup + analytics injection
- [app/page.tsx](app/page.tsx) — homepage
- [app/[pillar]/page.tsx](app/[pillar]/page.tsx), [app/[pillar]/[slug]/page.tsx](app/[pillar]/%5Bslug%5D/page.tsx) — pillar index + article detail
- [app/picks/page.tsx](app/picks/page.tsx), [app/picks/[category]/page.tsx](app/picks/%5Bcategory%5D/page.tsx), [app/picks/[category]/[slug]/page.tsx](app/picks/%5Bcategory%5D/%5Bslug%5D/page.tsx) — picks index + category + detail
- [app/lp/[slug]/route.ts](app/lp/%5Bslug%5D/route.ts) — landing-page raw HTML handler (asset path rewrite + GTM inject)
- [app/subscribe/page.tsx](app/subscribe/page.tsx) — full subscribe page (popup writes to same endpoint)
- [app/about/page.tsx](app/about/page.tsx), [app/privacy/page.tsx](app/privacy/page.tsx), [app/terms/page.tsx](app/terms/page.tsx)
- [app/opengraph-image.tsx](app/opengraph-image.tsx) — generated OG image

### App routes — admin
- [app/admin/layout.tsx](app/admin/layout.tsx) — admin chrome + editor gate
- [app/admin/page.tsx](app/admin/page.tsx) — dashboard with stats (⚠ stale copy: "article editor is coming next session" — the editor exists)
- [app/admin/signin/page.tsx](app/admin/signin/page.tsx), [app/admin/forgot-password/page.tsx](app/admin/forgot-password/page.tsx), [app/admin/reset-password/page.tsx](app/admin/reset-password/page.tsx) — auth flows
- [app/admin/articles/](app/admin/articles/) — list, new, edit, **import** subroutes
- [app/admin/picks/](app/admin/picks/) — list with filters/bulk actions, new, edit, **import**
- [app/admin/landing-pages/](app/admin/landing-pages/) — list, detail/file manager
- [app/admin/subscribers/page.tsx](app/admin/subscribers/page.tsx) — subscriber table
- [app/admin/site-images/](app/admin/site-images/) — site-settings key/value editor
- [app/auth/callback/route.ts](app/auth/callback/route.ts) — Supabase OAuth/OTP/reset-code exchange

### App routes — API
- [app/api/subscribe/route.ts](app/api/subscribe/route.ts) — subscriber capture + welcome-email send
- [app/api/cron/publish-scheduled/route.ts](app/api/cron/publish-scheduled/route.ts) — Vercel-cron-triggered article publish
- [app/api/admin/articles/](app/api/admin/articles/) — CRUD + `images/upload` + `import` + `draft` (AI)
- [app/api/admin/picks/](app/api/admin/picks/) — CRUD + `products` + `bulk` + `import`
- [app/api/admin/landing-pages/](app/api/admin/landing-pages/) — `init`, `upload`, per-slug file management + signed URLs
- [app/api/admin/images/upload/route.ts](app/api/admin/images/upload/route.ts) — generic image upload
- [app/api/admin/site-settings/route.ts](app/api/admin/site-settings/route.ts) — site-settings writer

### Emails
- [emails/welcome-email.tsx](emails/welcome-email.tsx) — React Email template for new-subscriber welcome

---

## 5. Environment variables (verified against `.env.local`)

Required everywhere (local + Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_ADDRESS=                    # e.g. "Guide Kin <hello@guidekn.com>"  (PROJECT_CONTEXT.md missed this)
ANTHROPIC_API_KEY=                      # Used by AI draft route. PROJECT_CONTEXT.md flagged as "possibly suspended" — verify before relying.
UNSPLASH_ACCESS_KEY=                    # For image search (off by default)
CRON_SECRET=                            # Vercel cron auth (PROJECT_CONTEXT.md missed this)
NEXT_PUBLIC_GTM_ID=GTM-WZCLJWBM
```

To add when voice agent unblocks (per PROJECT_CONTEXT.md):
```
VAPI_WEBHOOK_SECRET=
```

⚠ **Secret hygiene.** `.env.local` is git-ignored. Production secrets live in Vercel project env. Never paste keys into chat or commit them.

---

## 6. Deployment workflow

Local dev (PowerShell):

```powershell
# In project root
Remove-Item -Recurse -Force .next     # always clear cache before testing, esp. after new API routes
npm run dev                            # webpack, NOT turbopack
```

Ship:

```powershell
git add <specific files>
git commit -m "<descriptive message>"
git push                               # Vercel auto-deploys from main; preview deploys from PRs
```

Cron: defined in [vercel.json](vercel.json) → daily 06:00 UTC hits `/api/cron/publish-scheduled` with `Authorization: Bearer $CRON_SECRET`.

---

## 7. Open issues / TODOs surfaced by this audit

### Discrepancies between PROJECT_CONTEXT.md and code

1. **Admin auth is no longer magic-link.** PROJECT_CONTEXT.md §2 says "Auth (admin): Magic-link based." Reality: as of commit `257b4ad` ("Switch admin signin to email+password with reset flow"), the primary mode is **email + password** with a "Send me a sign-in link instead" toggle for OTP and a full forgot-password / reset-password flow. [app/admin/signin/page.tsx](app/admin/signin/page.tsx). **Recommendation:** update PROJECT_CONTEXT.md §2 stack table.

2. **"Related picks" on pillar pages is not implemented.** PROJECT_CONTEXT.md §3 (picks row) describes "Cross-linking from pillar pages via 'Related picks' sections." Grep finds no such section in [app/[pillar]/page.tsx](app/[pillar]/page.tsx); only intra-picks "Related picks" exists at [app/picks/[category]/[slug]/page.tsx:172](app/picks/%5Bcategory%5D/%5Bslug%5D/page.tsx#L172). **Recommendation:** either build it or remove the claim from spec.

3. **Site settings / site images admin is implemented but undocumented.** [app/admin/site-images/](app/admin/site-images/), [app/api/admin/site-settings/route.ts](app/api/admin/site-settings/route.ts), `getSiteSettings()` in [lib/supabase.ts:73](lib/supabase.ts#L73). Not in PROJECT_CONTEXT.md §3 or §4. **Recommendation:** add a "Site settings" row.

4. **ANTHROPIC_API_KEY exists, AI draft route exists, AI SDKs are installed.** PROJECT_CONTEXT.md §3 puts Anthropic API under "Deferred / parked" with "Account was suspended at some point; status unclear." But the code path is wired up. **Recommendation:** test the draft route end-to-end and update PROJECT_CONTEXT.md status to ✅ or 🟡.

5. **Env vars missing from PROJECT_CONTEXT.md §4 list:** `RESEND_FROM_ADDRESS`, `CRON_SECRET`. Both are required for shipped features and present in `.env.local`.

### Code-level cleanup candidates

6. **Stale dashboard copy.** [app/admin/page.tsx:73](app/admin/page.tsx#L73) — "The article editor is coming next session. For now, you can browse the existing site…" The article editor has shipped ([app/admin/articles/[id]/article-editor.tsx](app/admin/articles/%5Bid%5D/article-editor.tsx)).

7. **Console-noise in subscribe route.** [app/api/subscribe/route.ts:122-130](app/api/subscribe/route.ts#L122) has emoji-prefixed `console.log` debugging lines (`"📧 Email block reached"`, key prefix logging). Looks like leftover instrumentation; safe to remove before next ship.

8. **`dev-server.log`** is untracked at repo root (per `git status`). If it's just a stray log, gitignore it; if intentional, leave it.

9. **Uncommitted edits in flight** (per `git status` at session start): [app/admin/picks/page.tsx](app/admin/picks/page.tsx), [app/api/admin/articles/images/upload/route.ts](app/api/admin/articles/images/upload/route.ts), [app/api/admin/landing-pages/[slug]/route.ts](app/api/admin/landing-pages/%5Bslug%5D/route.ts), [components/site-footer.tsx](components/site-footer.tsx), [components/site-header.tsx](components/site-header.tsx). Plus untracked `app/admin/picks/filters.tsx`, `picks-list.tsx`, and `app/api/admin/picks/bulk/`. These look like the in-progress picks-bulk-ops work — confirm and commit or stash.

### Accepted tech debt (called out for awareness, not action)

- Pages use `dynamic = "force-dynamic"` widely. Intentional for v1; move to ISR/static when traffic justifies it.
- Landing-page asset rewrite is regex-based — won't catch URLs built dynamically in JS. Documented limit.
- `dataLayer` typing uses a `declare global` block in [components/analytics.tsx:7](components/analytics.tsx#L7). Keep it; TS needs it.

---

## 8. Quick-start (new dev or new AI session)

1. **Read this file and [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) in full** before touching code.
2. **Read the relevant Next.js doc** in `node_modules/next/dist/docs/` for any feature you'll touch — this is Next **16** with breaking changes.
3. **Boot locally:**
   ```powershell
   Remove-Item -Recurse -Force .next
   npm install
   npm run dev
   ```
4. **Verify the gotchas** in §2 are still respected after any structural change.
5. **For AI-generated copy:** import from [lib/brand-voice.ts](lib/brand-voice.ts). Never write voice rules inline.
6. **For article images:** always use `<ArticleImage>` from [components/article-image.tsx](components/article-image.tsx). Never the old `image_url ? <img/> : <div italic>` pattern.
7. **For admin pages:** call `getCurrentEditor()` from [lib/admin-auth.ts](lib/admin-auth.ts) and `redirect("/admin/signin")` if null.
8. **Before claiming "done":** build, run, click through the affected flow, check the browser console, check the network tab for unexpected requests.

---

*Last full audit: 2026-05-18. Re-audit when the codebase has drifted noticeably from this document — especially when shipping a feature that's currently 🟡 or ⛔ in §3.*
