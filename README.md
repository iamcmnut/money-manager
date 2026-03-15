# Manager.money

A modular personal finance web application built with Next.js, TypeScript, and deployed on Cloudflare.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Auth.js (Google OAuth + Email/Password) |
| Database | Cloudflare D1 (SQLite) |
| ORM | Drizzle ORM |
| i18n | next-intl (Thai & English) |
| Deployment | Cloudflare Pages |
| CI/CD | GitHub Actions |

## Features

- **Multi-Language Support** - Thai and English with URL-based locale routing
- **EV Calculator** - Calculate and compare electric vehicle charging costs
- **Living Cost Tracker** - Track and manage monthly living expenses
- **Savings Planner** - Plan and track savings goals
- **Admin Panel** - Manage users and view feature flags
- **Authentication** - Google OAuth and Email/Password sign-in
- **Cookie Consent** - GDPR-compliant cookie consent banner
- **Dark Mode** - System-aware theme switching

## Local Development

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Wrangler CLI** - Cloudflare's CLI tool (installed as dev dependency)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/manager.money.git
cd manager.money

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy environment file
cp .env.example .env.local

# 4. Generate AUTH_SECRET and add to .env.local
openssl rand -base64 32

# 5. Setup database (migrations + seed admin account)
npm run db:setup:local

# 6. Run development server with Cloudflare emulation
npm run dev:cf
```

The application will be available at `http://localhost:3000`.

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (no database) |
| `npm run dev:cf` | Start dev server with Cloudflare D1 emulation |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |
| `npm run test:run` | Run tests |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate:local` | Apply migrations to local D1 |
| `npm run db:seed:local` | Seed default admin account locally |
| `npm run db:setup:local` | Migrate + seed local database |
| `npm run db:studio` | Open Drizzle Studio |

### Environment Variables

Create a `.env.local` file:

```env
# Auth.js secret (required)
AUTH_SECRET=your_generated_secret_here

# App URL (required for OAuth callbacks)
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Feature Flags (true/false)
FEATURE_MODULE_EV=true
FEATURE_MODULE_LIVING_COST=true
FEATURE_MODULE_SAVINGS=true
FEATURE_AUTH_GOOGLE=false
FEATURE_AUTH_CREDENTIALS=true
```

### Feature Flags

Feature flags are configured via environment variables:

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `FEATURE_MODULE_EV` | `true` | Enable EV Calculator module |
| `FEATURE_MODULE_LIVING_COST` | `true` | Enable Living Cost module |
| `FEATURE_MODULE_SAVINGS` | `true` | Enable Savings module |
| `FEATURE_AUTH_GOOGLE` | `false` | Enable Google OAuth sign-in |
| `FEATURE_AUTH_CREDENTIALS` | `false` | Enable Email/Password sign-in |

### Troubleshooting

#### "Database not available" error

You need to run with Cloudflare emulation:

```bash
# Apply migrations first
npm run db:migrate:local

# Run with D1 support
npm run dev:cf
```

#### Peer dependency warnings

Use the legacy peer deps flag:

```bash
npm install --legacy-peer-deps
```

## Multi-Language Support (i18n)

The application supports Thai and English with URL-based locale routing.

### URL Structure

- `/en` - English home
- `/th` - Thai home
- `/en/ev` - English EV Calculator
- `/th/boss-office` - Thai Admin Panel

### Adding Translations

Translation files are located in `src/messages/`:

```
src/messages/
├── en.json    # English translations
└── th.json    # Thai translations
```

### Language Switcher

A language switcher with country flags is available in the header. User preference is saved to localStorage.

## Project Structure

```
manager.money/
├── src/
│   ├── app/
│   │   ├── [locale]/              # Locale-based routes
│   │   │   ├── layout.tsx         # Locale layout with providers
│   │   │   ├── page.tsx           # Home page
│   │   │   ├── ev/                # EV Calculator
│   │   │   ├── living-cost/       # Living Cost
│   │   │   ├── savings/           # Savings
│   │   │   ├── auth/              # Auth pages
│   │   │   │   ├── signin/
│   │   │   │   └── error/
│   │   │   └── boss-office/       # Admin panel (protected)
│   │   ├── api/                   # API routes (no locale)
│   │   │   ├── auth/
│   │   │   └── admin/
│   │   ├── layout.tsx             # Root layout
│   │   └── sitemap.ts             # Multi-locale sitemap
│   ├── components/
│   │   ├── auth/                  # Auth components
│   │   ├── layout/                # Header, footer, nav, cookie consent
│   │   ├── providers/             # Context providers
│   │   └── ui/                    # shadcn/ui components
│   ├── i18n/                      # Internationalization config
│   │   ├── config.ts              # Locale definitions
│   │   ├── routing.ts             # URL routing config
│   │   ├── request.ts             # Server-side locale resolution
│   │   └── navigation.ts          # Locale-aware navigation
│   ├── lib/
│   │   ├── db/                    # Database schema
│   │   ├── server/                # Server utilities (D1)
│   │   ├── auth.ts                # Auth.js configuration
│   │   ├── feature-flags.ts       # Feature flag utilities
│   │   └── utils.ts               # General utilities
│   └── messages/                  # Translation files
│       ├── en.json
│       └── th.json
├── drizzle/                       # Database migrations
├── wrangler.toml                  # Cloudflare configuration
└── next.config.ts                 # Next.js + next-intl config
```

## Authentication

### Email/Password Authentication

Enable by setting `FEATURE_AUTH_CREDENTIALS=true` in `.env.local`.

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Google OAuth

Enable by setting `FEATURE_AUTH_GOOGLE=true` and configuring Google credentials.

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add credentials to `.env.local`

## Database

### Schema

The application uses Cloudflare D1 with Drizzle ORM.

| Table | Description |
|-------|-------------|
| `users` | User accounts (id, email, password, name, role) |
| `accounts` | OAuth provider accounts |
| `sessions` | User sessions |
| `verification_tokens` | Email verification tokens |

### Migrations

```bash
# Generate new migration after schema changes
npm run db:generate

# Apply migrations locally
npm run db:migrate:local

# Apply migrations to production
npm run db:migrate:prod
```

## Deployment

### GitHub Actions

On push to `main`:
1. Lint & Typecheck
2. Build
3. Deploy to Cloudflare Pages

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `AUTH_SECRET` | Auth.js secret key |

### Production Environment Variables

Set these in Cloudflare Pages dashboard:

```
AUTH_SECRET=<your-secret>
FEATURE_AUTH_CREDENTIALS=true
FEATURE_AUTH_GOOGLE=false
# ... other feature flags
```

## Admin Panel

Access at `/{locale}/boss-office` (e.g., `/en/boss-office`).

### Default Admin Account

A default admin account is created when running the seed script:

| Field | Value |
|-------|-------|
| Email | `admin@admin` |
| Password | `admin` |
| Role | `admin` |

Run the seed with:
```bash
# Local
npm run db:seed:local

# Production
npm run db:seed:prod
```

**Features:**
- View registered users
- Change user roles (user/admin)
- View feature flag status (read-only, configured via env vars)
- View current session info

## Testing

```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm run test

# Run with coverage
npm run test:coverage
```

## License

MIT
