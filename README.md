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
| Feature Flags | Cloudflare KV |
| Deployment | Cloudflare Pages |
| CI/CD | GitHub Actions |

## Features

- **EV Calculator** - Calculate and compare electric vehicle charging costs
- **Living Cost Tracker** - Track and manage monthly living expenses
- **Savings Planner** - Plan and track savings goals
- **Admin Panel** - Manage users and feature flags
- **Authentication** - Google OAuth and Email/Password sign-in (toggleable via feature flags)

## Local Development

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Wrangler CLI** - Cloudflare's CLI tool for local development
  ```bash
  npm install -g wrangler
  ```
- **Git** - For version control

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

# 5. Apply database migrations (creates local D1 database)
npm run db:migrate:local

# 6. Run development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Step-by-Step Setup

#### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> **Note:** The `--legacy-peer-deps` flag is required due to peer dependency conflicts with `@cloudflare/next-on-pages` and Next.js 16.

#### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Auth.js secret (required)
# Generate with: openssl rand -base64 32
AUTH_SECRET=your_generated_secret_here

# App URL (required for OAuth callbacks)
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional - only needed if Google sign-in is enabled)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### 3. Set Up Local Database

The project uses Cloudflare D1 (SQLite) for the database. For local development, Wrangler creates a local SQLite database automatically.

```bash
# Apply all migrations to create tables
npm run db:migrate:local

# (Optional) View database in Drizzle Studio
npm run db:studio
```

#### 4. Start Development Server

```bash
npm run dev
```

This starts the Next.js development server with Cloudflare bindings support.

#### 5. Create First Admin User

Since authentication is disabled by default, you need to:

1. **Option A: Use Drizzle Studio**
   ```bash
   npm run db:studio
   ```
   Navigate to the `users` table and manually insert an admin user.

2. **Option B: Enable credentials auth via API**
   ```bash
   # Seed default feature flags (enables auth_credentials)
   curl -X POST http://localhost:3000/api/admin/flags
   ```
   Then register via the sign-in page at `/auth/signin`.

3. **Option C: Direct database insert**
   ```bash
   wrangler d1 execute manage-money-db --local --command "INSERT INTO users (id, email, name, role) VALUES ('admin-1', 'admin@example.com', 'Admin', 'admin')"
   ```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Secret key for Auth.js session encryption |
| `NEXTAUTH_URL` | Yes | Base URL of your application |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Cloudflare bindings |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:generate` | Generate Drizzle migrations after schema changes |
| `npm run db:migrate:local` | Apply migrations to local D1 database |
| `npm run db:migrate:prod` | Apply migrations to production D1 database |
| `npm run db:studio` | Open Drizzle Studio to browse database |

### Troubleshooting

#### "Database not available" errors

Make sure you've run migrations:
```bash
npm run db:migrate:local
```

#### Port 3000 already in use

Kill the process or use a different port:
```bash
# Find and kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

#### Peer dependency warnings

Use the legacy peer deps flag:
```bash
npm install --legacy-peer-deps
```

#### Wrangler authentication issues

Login to Cloudflare (only needed for remote operations):
```bash
wrangler login
```

### Development Workflow

1. **Make code changes** - Edit files in `src/`
2. **Check types** - `npm run typecheck`
3. **Lint code** - `npm run lint`
4. **Format code** - `npm run format`
5. **Run tests** - `npm run test:run`
6. **Test locally** - `npm run dev`
7. **Database changes** - Edit `src/lib/db/schema.ts`, then run:
   ```bash
   npm run db:generate
   npm run db:migrate:local
   ```

## Testing

The project uses [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit and component testing.

### Running Tests

```bash
# Run tests in watch mode (recommended during development)
npm run test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
src/
├── lib/
│   ├── password.test.ts      # Password utility tests
│   ├── feature-flags.test.ts # Feature flag tests
│   └── utils.test.ts         # Utility function tests
├── components/
│   └── ui/
│       └── button.test.tsx   # Button component tests
└── test/
    ├── setup.ts              # Test setup and mocks
    └── vitest.d.ts           # TypeScript declarations
```

### Writing Tests

- Place test files next to the code they test with `.test.ts` or `.test.tsx` extension
- Use `describe` blocks to group related tests
- Use `it` or `test` for individual test cases
- Mock external dependencies using `vi.fn()` and `vi.mock()`

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

## Project Structure

```
manager.money/
├── .github/workflows/        # GitHub Actions CI/CD
├── drizzle/                  # Database migrations
├── public/                   # Static assets
├── src/
│   ├── app/
│   │   ├── (public)/         # Public pages
│   │   │   ├── page.tsx      # Home
│   │   │   ├── ev/           # EV Calculator
│   │   │   ├── living-cost/  # Living Cost
│   │   │   └── savings/      # Savings
│   │   ├── auth/             # Auth pages
│   │   │   ├── signin/       # Sign-in page
│   │   │   └── error/        # Auth error page
│   │   ├── boss-office/      # Admin panel (protected)
│   │   └── api/
│   │       ├── auth/         # Auth endpoints
│   │       │   ├── [...nextauth]/ # NextAuth handler
│   │       │   ├── register/     # User registration
│   │       │   └── status/       # Auth status
│   │       └── admin/        # Admin endpoints
│   │           ├── flags/    # Feature flags CRUD
│   │           └── users/    # User management
│   ├── components/
│   │   ├── auth/             # Auth components
│   │   ├── layout/           # Layout (header, footer, nav)
│   │   ├── providers/        # Context providers
│   │   ├── seo/              # SEO components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/
│   │   ├── db/               # Database schema
│   │   ├── server/           # Server utilities (D1, KV)
│   │   ├── auth.ts           # Auth.js configuration
│   │   ├── cloudflare.ts     # Cloudflare bindings
│   │   ├── feature-flags.ts  # Feature flag utilities
│   │   ├── password.ts       # Password hashing
│   │   └── utils.ts          # General utilities
│   └── types/                # TypeScript definitions
├── wrangler.toml             # Cloudflare configuration
└── drizzle.config.ts         # Drizzle ORM configuration
```

## Authentication

Authentication is controlled via feature flags and supports two methods:

### Email/Password Authentication

Users can register and sign in with email and password.

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Google OAuth

Users can sign in with their Google account.

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add credentials to `.env.local`

### Enabling Authentication

Both authentication methods are **disabled by default**. To enable:

1. Go to `/boss-office` (Admin Panel)
2. Toggle **Email/Password Sign-in** and/or **Google Sign-in**
3. Click **Save Changes**

## API Documentation

For detailed API documentation including all endpoints, request/response formats, and error codes, see [docs/api.md](docs/api.md).

## Database

### Schema

The application uses Cloudflare D1 with Drizzle ORM.

| Table | Description |
|-------|-------------|
| `users` | User accounts (id, email, password, name, role, etc.) |
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

## Feature Flags

Feature flags are stored in Cloudflare KV and managed via the Admin Panel.

### Module Flags

| Flag | Default | Description |
|------|---------|-------------|
| `module_ev` | `true` | Enable EV Calculator module |
| `module_living_cost` | `true` | Enable Living Cost module |
| `module_savings` | `true` | Enable Savings module |

### Authentication Flags

| Flag | Default | Description |
|------|---------|-------------|
| `auth_google` | `false` | Enable Google OAuth sign-in |
| `auth_credentials` | `false` | Enable Email/Password sign-in |

## Deployment

### GitHub Actions

The project uses GitHub Actions for CI/CD. On push to `main`:

1. **Lint & Typecheck** - Runs ESLint and TypeScript checks
2. **Build** - Builds the Next.js application
3. **Deploy** - Deploys to Cloudflare Pages

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `AUTH_SECRET` | Auth.js secret key (required) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) |

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy .next --project-name=manager-money
```

### Production Setup

1. Create D1 database on Cloudflare
2. Create KV namespace on Cloudflare
3. Update `wrangler.toml` with production IDs
4. Run migrations: `npm run db:migrate:prod`
5. Deploy application

## Admin Panel

Access the admin panel at `/boss-office` (requires authentication).

Features:
- **User Management** - View users, change roles (user/admin)
- **Feature Flags** - Toggle modules and authentication methods
- **Session Info** - View current user session details

## License

MIT
