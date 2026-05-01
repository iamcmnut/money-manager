# Manager.money - Agent Guide

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives + CVA) |
| Auth | Auth.js v5 beta (Google OAuth + Credentials) |
| Database | Cloudflare D1 (SQLite) |
| ORM | Drizzle ORM |
| i18n | next-intl v4 (Thai & English, URL-based locale routing) |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | IBM Plex Sans + IBM Plex Sans Thai + IBM Plex Mono |
| Testing | Vitest + Testing Library (jsdom) |
| Deployment | Cloudflare Pages via OpenNextJS |
| Storage | Cloudflare KV (feature flags, cache) + R2 (file uploads) |

## Development

```bash
npm run build:worker && npm run dev:cf   # Full dev with DB (localhost:8788)
npm run dev                               # Next.js only, no DB (localhost:3000)
npm run test:run                          # Run tests
npm run lint && npm run typecheck         # Lint + type check
```

Database commands: `npm run db:migrate:local`, `npm run db:seed:local`, `npm run db:setup:local`

## Project Structure

```
src/
├── app/
│   ├── [locale]/                    # Locale-based routes (en, th)
│   │   ├── page.tsx                 # Home — module cards grid
│   │   ├── ev/                      # EV charging price comparison
│   │   │   ├── page.tsx             # Server component: metadata, SEO, feature gates
│   │   │   ├── history/page.tsx     # Auth-protected charging history page
│   │   │   └── _components/         # Client components: dashboard, charts, forms
│   │   ├── living-cost/             # Living cost tracker (placeholder)
│   │   ├── savings/                 # Savings planner (placeholder)
│   │   ├── auth/signin/             # Sign-in page
│   │   └── boss-office/             # Admin panel (admin role required)
│   │       └── _components/         # Users, networks, flags, referral codes
│   └── api/
│       ├── auth/                    # NextAuth.js + registration
│       ├── ev/                      # Stats, records, networks, daily-prices, import
│       ├── admin/                   # Flags, users, charging-networks, charging-records
│       └── upload/                  # R2 file upload
├── components/
│   ├── ui/                          # shadcn/ui: button, card, dialog, avatar, pagination, etc.
│   ├── auth/                        # Login buttons, user menu
│   ├── layout/                      # Header, footer, mobile nav, language switcher, theme toggle
│   ├── seo/                         # JSON-LD structured data
│   ├── providers/                   # Session + theme providers
│   └── feature-gate.tsx             # Async server component for feature flag gating
├── lib/
│   ├── db/schema.ts                 # Drizzle schema (7 tables)
│   ├── server/                      # Cloudflare bindings: db.ts, kv.ts, r2.ts
│   ├── feature-flags.ts             # Feature flag system (KV + env fallback)
│   ├── auth.ts                      # Auth.js config (providers, callbacks, JWT)
│   ├── rate-limit.ts                # Login/registration rate limiting
│   ├── password.ts                  # PBKDF2-SHA256 hashing + validation
│   ├── format.ts                    # formatNumber(), formatBaht()
│   ├── sanitize-url.ts              # URL validation
│   └── cloudflare.ts                # getDb(), getKV(), getCloudflareEnv()
├── i18n/                            # Locale config, routing, navigation
├── messages/                        # en.json, th.json translation files
└── proxy.ts                          # i18n + auth + security headers (Next.js 16: was middleware.ts)
```

## Database Schema

7 tables in `src/lib/db/schema.ts`:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (id, email, password, name, role: user/admin) |
| `accounts` | Auth.js OAuth provider accounts |
| `sessions` | Auth.js JWT sessions |
| `verificationTokens` | Email verification tokens |
| `chargingNetworks` | EV brands (name, logo, website, phone, brandColor, referralCode, captions) |
| `chargingRecords` | User charging sessions (userId, brandId, kWh, cost, mileage, timestamps) |
| `loginAttempts` | Brute force protection (identifier, type, success, IP) |

## Feature Flags

Defined in `src/lib/feature-flags.ts`. Production: Cloudflare KV. Local dev: `process.env` fallback.
Admin panel auto-discovers all flags via `getAllFeatureFlags()`.

| Flag | Default | Controls |
|------|---------|----------|
| `module_ev` | `true` | Entire EV module page visibility |
| `module_living_cost` | `true` | Entire Living Cost module page visibility |
| `module_savings` | `true` | Entire Savings module page visibility |
| `auth_google` | `false` | Google OAuth sign-in option |
| `auth_credentials` | `false` | Email/password sign-in option |
| `auth_registration` | `false` | New user registration |
| `ev_daily_price_chart` | `true` | Daily price sparkline in expanded EV cards |
| `ev_coupon` | `true` | Referral/coupon codes in expanded EV cards |
| `ev_history` | `true` | Charging history page (/ev/history) and nav button |

**Usage patterns:**
- Server components: `await getFeatureFlag('flag_name')` or `<FeatureGate flag="flag_name">`
- Client components: flag values passed as props from server → client component chain

## Key Patterns

### Data Flow (EV module example)
```
page.tsx (server) → fetches feature flags, generates metadata/SEO
  → EVDashboard (client) → fetches /api/ev/stats on mount
    → PriceComparisonChart → expandable network cards
      → NetworkDailyPriceChart → fetches /api/ev/stats/daily-prices
```

### API Routes
- Auth required: check session, return 401 if missing
- Admin required: check `session.user.role === 'admin'`, return 403
- Caching: KV with 60s TTL for stats, HTTP Cache-Control for public data
- IDs: `prefix-{Date.now()}-{random}` format
- Pagination: `?page=1&limit=10`, max limit 100

### Component Conventions
- `'use client'` only on interactive components; pages are server components
- `_components/` directory for page-specific components
- Props interface named `{ComponentName}Props`
- Loading: `animate-pulse` skeleton divs
- Errors: inline `border-destructive/20 bg-destructive/5` alert boxes
- Empty states: centered icon + heading + helper text
- Pagination: shared `Pagination` component, 10 items per page

### Styling
- `cn()` utility (clsx + tailwind-merge) for class composition
- Module colors: `text-module-ev`, `bg-module-ev-muted` (teal), `text-module-living` (orange), `text-module-savings` (green)
- Warm neutrals — no pure white/black
- Border radius: `--radius: 0.875rem` (14px)
- Dark mode via `.dark` class (next-themes)

### i18n
- All user-facing text via `useTranslations('namespace')` (client) or `getTranslations()` (server)
- Messages in `src/messages/en.json` and `th.json`
- Locale in URL: `/en/ev`, `/th/ev`
- `useLocale()` for locale-dependent logic (e.g., referral caption language)

### Testing
- Vitest + Testing Library with jsdom
- Test files co-located: `component.test.tsx` next to `component.tsx`
- Mock Cloudflare KV via `createMockKV()` in `src/test/setup.ts`
- Mock `next-intl` translations return the key as text

### Security
- Protected routes (proxy): `/boss-office`, `/ev/history`, `/settings` — redirect to signin if no session token
- Middleware adds: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`
- Password: PBKDF2-SHA256, 50k iterations, 16-byte salt
- Rate limiting: 5 login attempts / 15 min, 3 registration attempts / 1 hr
- URL sanitization: only http/https allowed

## Design Context

### Users
- **Who**: Thai individuals (all genders, ages 20–60+) managing personal finances
- **Context**: Checking EV charging prices, comparing savings rates, evaluating regional living costs — often on mobile, sometimes desktop
- **Job to be done**: Get clear, actionable financial comparisons and suggestions so they can make smarter money decisions without needing financial expertise
- **Language**: Thai (primary) and English — the interface must feel native in both

### Brand Personality
- **3 words**: Warm, friendly, playful
- **Voice**: Like a knowledgeable friend who explains money simply — never condescending, never jargon-heavy
- **Tone**: Encouraging and calm. Finance is stressful; this app should reduce anxiety, not add to it
- **Emotional goal**: Users should feel "I understand my money better now" — confident, not overwhelmed, and maybe even smile

### Aesthetic Direction
- **Visual tone**: Soft yet playful — warm colors, bouncy interactions, bubbly shapes, calm but with personality
- **References**: Monzo (clarity), Notion (warmth), Headspace (approachability)
- **Anti-references**: Bloomberg Terminal (too dense), generic AI dashboards (gradient rainbows, glassmorphism, blur orbs), overly corporate banking apps (cold, intimidating)
- **Theme**: Light and dark mode, both feeling warm — avoid pure white (#fff) and pure black (#000). Use warm neutrals.
- **Color approach**: Purposeful and restrained. One primary brand color, one accent. Use color to communicate meaning (cost = one color, savings = another), not to decorate.
- **Typography**: Should feel approachable and readable, especially for Thai script. Avoid generic defaults (Geist, Inter, Roboto). Consider a font that handles both Latin and Thai beautifully.

### Design Principles

1. **Clarity over decoration** — Every visual element must communicate something. If it's purely decorative, remove it. Numbers, comparisons, and suggestions should be instantly scannable.

2. **Warm, not cold** — Finance apps tend toward cold precision. This app should feel like a helpful friend. Use warm neutrals, gentle radius, and friendly copy. Avoid sharp edges, stark contrasts, and clinical layouts.

3. **One thing at a time** — Don't overwhelm users with dashboards full of equal-weight metrics. Lead with the most important insight, then let users explore deeper. Progressive disclosure over information dump.

4. **Inclusive by default** — WCAG AA compliance. The audience spans 20–60+ years old — text must be readable, touch targets generous, and color never the only way to convey meaning. Both Thai and English must feel like first-class citizens, not afterthoughts.

5. **Earned complexity** — Start simple. Add density only where users need it (e.g., detailed price comparison tables). The home page should feel effortless; the deep pages can be richer.

6. **Delightful details** — Small moments of joy (a hover bounce, a tactile press, a springy chart) make the app feel alive without distracting from the task.
