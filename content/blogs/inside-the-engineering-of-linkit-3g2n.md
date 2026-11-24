---
id: inside-the-engineering-of-linkit-3g2n
slug: inside-the-engineering-of-linkit-3g2n
tags:
  - architecture
  - webdev
  - saas
title: Inside the Engineering of Linkit
excerpt: I built Linkit - a link-in-bio SaaS for creators, freelancers, and small businesses. It started as a...
archived: false
featured: false
sortOrder: 999
coverImage:
readingTimeMinutes: 7
---

I built **Linkit** - a link-in-bio SaaS for creators, freelancers, and small businesses. It started as a simple link manager and grew into profiles, forms, a lightweight shop, social caching, audience messaging, and an AI assistant (Lynki).

This post is about the **main React app** and **Express API** only. I'll walk through how the system works, the mistakes that hurt me in production, and what I'd change if I started again.

> **Stack in one line:** Vite + React + Tailwind/shadcn on the frontend, Express on Node for secrets/AI/OAuth, Firebase Auth + Firestore + Storage as the data plane, deployed on Vercel.

---

## Why I built it

Most link-in-bio tools are either too shallow (a list of buttons) or too expensive. I wanted one product where a creator could:

- share a public page (`/:username`)
- manage links and design from a dashboard
- collect leads with forms
- take simple catalog orders
- talk to visitors (and get AI help)

I chose **Firebase** so I could ship Auth + DB + Storage fast. I added an **Express backend** the moment I needed API keys, OAuth exchanges, scrapers, or rate-limited public AI - those never belong in `VITE_*` env vars.

---

## Overall architecture

Linkit is a **dual-path** system:

1. **Browser -> Firebase** for user-owned CRUD (profiles, links, forms, orders), enforced by security rules
2. **Browser -> Express** for secrets, AI, OAuth, crawling, and anything I can't safely do on the client

```text
[React SPA (Vite)] -- axios + ID token --> [Express API]
       |                                      |
       | Firebase client SDK                  | Firebase Admin
       v                                      v
       +----------- Firebase Auth ------------+
       +----------- Firestore ----------------+
       +----------- Storage ------------------+
       ^
       | PostHog analytics
```

| Surface | URL |
|---------|-----|
| Frontend | `https://linkitapp.in` |
| API | `https://api.linkitapp.in` |
| Local | `:8080` (app) + `:5001` (API) |

---

## Frontend

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| UI | Tailwind + shadcn/Radix |
| HTTP | axios (`src/lib/api.ts`) - attaches Firebase ID token |
| Icons | Phosphor (+ SVGL for social brands) |
| State | React Context - no Redux/Zustand |

Provider order in `App.tsx`:

```text
QueryClient -> Auth -> Profile -> Currency -> UI -> Cart -> Router -> App
```

**Important routing rule:** the public profile catch-all `/:username` must stay near the end of the route table. Put a new route after it and you break every public profile.

### How I read Firestore (and why I don't use onSnapshot everywhere)

Early on I used live `onSnapshot` listeners like everyone does. On Firebase Spark, that burned quota and multiplied listener churn.

So I built a shared poll helper (`sharedFirestorePoll.ts`): one interval, many React subscribers.

| Data | Interval | Why |
|------|----------|-----|
| Links | ~90s | Dashboard lists don't need live updates |
| Forms | ~120s | Same |
| Profile doc | ~300s | Changes rarely |
| Audience messages | **live snapshot** | Chat felt broken under polling |

Real-time is a product choice, not a default.

---

## Backend

Express ESM app. Thin routes, logic in `services/`, auth in middleware.

```text
/auth          token helpers, student domains
/forms         share, submit, integrations
/ai            Lynki + public chat + helpers
/social        OAuth, refresh, metrics
/cloudinary    authenticated upload/delete
/payment       -> HTTP 410 (removed)
/order-payment -> HTTP 410 (removed)
```

Auth middleware is simple:

```js
const token = authHeader.split('Bearer ')[1];
const decoded = await admin.auth().verifyIdToken(token);
req.uid = decoded.uid;
```

I also use:

- `optionalVerifyToken` for guest-friendly routes
- `requireAdmin` (custom claim **or** allowlisted UID)
- `budgetGuard` IP rate limits for public/AI endpoints

Social refresh can run **inline** in the API process (serverless-friendly) or as a **BullMQ worker** when Redis is available.

---

## Database

Firestore is the primary DB. Rules are **default deny**, then explicit allows.

```text
users --> profiles --> links
             |
             +--> forms --> form_submissions
             +--> catalogs --> products
             +--> orders
             +--> audience_threads --> messages
             +--> social_* / public_profile_cache

usernames          (unique handle reservation)
user_integrations  (OAuth tokens - server-oriented)
analytics          (owner-only writes - see quota story)
lynki_*            (usage + BYOK settings)
app_config         (maintenance mode, testers)
```

**Why Firestore:** fast to ship with Auth/Storage.
**Cost:** Spark quotas are unforgiving, and it's a bad public event bus (I learned that the hard way).

I almost used Supabase early - the dependency is still in `package.json` as a fossil. It was never wired.

---

## Authentication flow

```text
User signs in (email / Google / GitHub)
        |
        v
Firebase Auth session
        |
        +--> ProtectedRoute -> dashboard
        +--> api.ts interceptor -> Authorization: Bearer <idToken>
                                      |
                                      v
                              Express verifyIdToken
                                      |
                                      v
                                  req.uid set
```

I harden redirects with `buildAuthHref()` so a `?redirect=` query can't become an open redirect.

---

## Files and media

- **Firebase Storage** for user/profile/form assets, path-scoped in `storage.rules` (~15MB caps)
- **Cloudinary** for backgrounds/transforms; backend upload proxy keeps secrets server-side

Early storage rules were too broad (any authenticated user could touch too much). I scoped them to `users/`, `profiles/`, and `forms/` after a production audit.

---

## AI (Lynki)

Two modes:

| Mode | Endpoint | Guard |
|------|----------|-------|
| Visitor chat on public profiles | `POST /ai/public-chat` | Optional auth + IP rate limit + feature flag |
| Dashboard agent | `POST /ai/lynki/chat` | Required auth + usage caps or BYOK |

A provider router falls back across OpenRouter / Groq / GitHub Models. The model can propose actions; the **client** executes drafts. I don't give the model raw Firestore write access.

---

## Payments (or: how I deleted them)

All features are free today. Prices in `shared/linkitPricingDefaults.js` are `0`. Payment routes return **410 Gone**.

I still keep plan enums (`free`, `max`, `badge`, `student`) and an entitlements module - but they currently unlock everything. That makes re-monetization possible without rewriting the UI.

I had previously built Cashfree flows, shop gates, and payment settings. Then the product decision flipped. Monetization reversed faster than the architecture - so I tombstoned APIs and cleaned dead CTAs/tours in an audit pass instead of leaving ghosts.

---

## Deploy and ops

```text
Git push
   +--> Vercel frontend (SPA -> index.html)
   +--> Vercel backend (serverless Express)
   +--> Firebase (rules + indexes + storage rules)

Optional: Redis + social worker on a small VPS
```

Secrets live only in `backend/.env`. Anything `VITE_*` is public in the browser bundle.

I smoke-test with:

```bash
npm run smoke:stabilization
npm run lint
```

---

## Caching (really: quota defense)

I don't have a fancy multi-layer CDN cache story. Most "caching" is about not dying on Spark:

| Layer | What I do |
|-------|-----------|
| Dashboard reads | Shared polls (90â€“300s) |
| Quota spike | Pause polls until next UTC day |
| Social | Materialized `public_profile_cache` + queued refresh |
| Analytics | Prefer PostHog; Firestore increments behind a kill switch |

---

## Security (the non-negotiables)

- Default-deny Firestore/Storage rules
- Firebase ID tokens on protected APIs
- CORS allowlist + Helmet
- Sanitize user HTML (DOMPurify)
- Rate-limit public AI/forms/uploads
- Safe auth redirects
- No secrets in `VITE_*`

Still imperfect: public profile docs can expose more fields than a minimal DTO. I'd split owner-private fields into a subcollection if I rebuilt.

---

## Request lifecycle (happy path)

**Dashboard API call**

```text
UI -> api.get('/...') -> attach ID token -> Express -> verifyToken -> service -> JSON
```

**Public profile**

```text
/:username -> query profile by username -> load links/products
          -> PostHog view event
          -> optional /ai/public-chat
```

**Social refresh**

```text
trigger -> enqueue job -> crawler -> write cache/crawl state
        (never scrape live on the hot request path)
```

---

## Folder structure

```text
src/                 # React app
  pages/             # routes
  components/        # features + ui/
  contexts/          # Auth, Profile, Currency, UI, Cart
  hooks/             # polling hooks
  lib/               # api, poll, authFlow, lynki, errors
backend/
  routes/            # HTTP
  services/          # business logic
  middleware/        # auth, budgetGuard
  workers/           # social refresh
shared/              # pricing defaults (FE + BE)
firestore.rules
storage.rules
AGENTS.md            # living engineering handbook
```

---

## The engineering journey (what actually happened)

### 1. Ship fast on Firebase

Vite + React + shadcn + Firebase. Link Manager first. Express when secrets appeared. That bet was right for speed.

### 2. Features exploded

Forms, shop, social, Lynki, admin, maintenance mode. The app stopped being "a link list."

### 3. I turned payments onâ€¦ then off

I integrated Cashfree, gated shops behind payment settings, and used live listeners on orders. Later I made everything free. The painful part wasn't deleting payment code - it was finding every tour, CTA, and gate that still pointed at a dead flow.

**Lesson:** if monetization can flip, put it behind flags and ship **410 tombstones** when you remove it.

### 4. The Firestore quota crisis

Public profile pages called analytics writes from the browser. Rules allowed essentially anyone to update `analytics/{userId}`. Profiles are crawlable. Bots don't care about your DAU.

I saw a write spike on the order of **~20k** that looked like traffic, but was mostly crawlers.

**Fixes that became architecture:**

1. Analytics writes -> **owner-only** in rules
2. `VITE_ENABLE_FIRESTORE_ANALYTICS=false` by default
3. Prefer **PostHog** for public metrics
4. Replace most `onSnapshot` with **shared polling**
5. Quota circuit breaker in the poll layer

**Lesson:** never use your primary user database as a public counter store.

### 5. Polling broke chat - so I brought snapshots back (narrowly)

After the quota scare I tried to keep audience messaging on polls. Send/receive felt unreliable. Chat is latency-sensitive.

I fixed it with batch writes + **Messages-tab-scoped** live listeners. Real-time returned - but only where the product needs it.

### 6. Social scraping on the request path failed

Live browser scrapes melted small hosts. I moved to cache-first orchestration, queued refresh, differential crawl, and default-off expensive flags.

### 7. Production audit (July 2026)

I cleaned payment ghosts, scoped storage rules, centralized error mapping, and fixed audience reliability. Bundle size and unfinished design-token migration are still debt.

---

## Mistakes I'd warn my past self about

1. **Public client writes to Firestore** - bots will find them
2. **`onSnapshot` as default** - pay for real-time only when UX requires it
3. **Removing payments without an audit checklist** - dead CTAs linger
4. **Broad storage rules** - scope by owner path
5. **Leaving unused deps** (Supabase) - they lie to every future reader
6. **Half-finished design migrations** - finish or delete
7. **Putting routes after `/:username`** - instant public-profile breakage

---

## What I'd build differently

1. Keep **product analytics outside Firestore** from day one
2. Ship a **public profile DTO** - don't serve the whole owner document
3. Make a **worker service** first-class (don't pretend serverless HTTP is a crawler host)
4. Put **payments behind a feature flag** before writing UI gates
5. **Code-split** heavy pages (Profile, Forms, Link Manager) immediately
6. Finish **one** design system before feature explosion
7. Use **Redis/edge rate limits** before going multi-instance
8. Write the incident notes while they're hot - and don't delete them

---

## Closing

Linkit taught me that architecture isn't just boxes on a diagram. On a Firebase Spark + Vercel budget, **rules, quotas, and abuse paths** shape the product as much as React components do.

If you're building a similar dual-path Firebase + Express app: steal the dual-path clarity, the poll-by-default habit, and the 410 tombstone idea. Try not to steal the analytics-write mistake.

---

### Quick reference

| Item | Choice |
|------|--------|
| Frontend | React + Vite (`src/`) |
| Backend | Express (`backend/`) |
| Auth | Firebase ID tokens |
| DB | Firestore (default deny) |
| Files | Storage + Cloudinary |
| Payments | Removed (410); everything free |
| Analytics | PostHog preferred |
| Polling | `sharedFirestorePoll.ts` |
| Handbook | `AGENTS.md` |
