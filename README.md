# React + Node SaaS Boilerplate

A production-ready, security-first boilerplate for building multi-tenant SaaS applications. Fork it, configure your environment, and start building your product on top of a solid foundation — instead of rebuilding auth, roles, tenancy, and API access from scratch every time.

> **AI-friendly:** This README is written to serve as a complete briefing document for AI coding assistants. See the [AI Context](#ai-context-briefing-for-ai-assistants) section at the bottom.

---

## Philosophy

Every architectural decision in this boilerplate follows a simple rule: **choose the approach that is most secure by default, even if it requires more upfront work.**

This means:
- No JWT tokens stored in localStorage (XSS attack surface)
- No "refresh token" patterns in the browser (they have the same risk profile as long-lived JWTs)
- No wildcard CORS
- No plaintext API key storage
- No role checks on the frontend alone

The boilerplate was designed to handle the parts of a SaaS that are identical across projects — authentication, sessions, role-based access, API keys, and multi-tenancy — so you can focus entirely on your product's domain logic.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js + TypeScript | Type safety across the entire backend |
| Framework | Express 5 | Native async error handling, no wrapper needed |
| Database | MongoDB Atlas via Prisma | Flexible schema, hosted, free tier available |
| ORM | Prisma | Type-safe queries, MongoDB support |
| Session store | Custom Prisma store (MongoDB) | Persistent sessions survive server restarts |
| Validation | Zod | Runtime type safety at API boundaries |
| Password hashing | bcrypt | Industry standard for low-entropy inputs |
| API key hashing | SHA-256 | Appropriate for high-entropy random strings |
| Logging | Pino + pino-http | Structured JSON logs, minimal overhead |
| Security headers | Helmet | CSP, HSTS, X-Frame-Options, and more |
| Rate limiting | express-rate-limit | Protects auth endpoints from brute force |
| API docs | Swagger UI (dev only) | Available at `/docs` in development |
| Local dev / containers | Docker Compose (backend + Mongo) | Run everything locally without an Atlas account — see [Alternative: Docker Compose](#alternative-docker-compose) |

---

## Authentication Architecture

This boilerplate uses a **Clerk-style hybrid authentication model**, chosen after researching the tradeoffs between JWTs and server-side sessions.

### The Two JWT Laws

JWTs are only safe when both conditions are met simultaneously:
1. **Single-use purpose** — one token, one specific action
2. **Short expiration** — ≤ 5 minutes

A JWT stored in a cookie or localStorage that lives for hours or days violates both laws. If compromised, it cannot be revoked.

### How This Boilerplate Handles Auth

```
Browser Users          →  Server-side session (httpOnly cookie)
Microservice calls     →  Short-lived JWT (≤ 5 min, single-purpose)
External API clients   →  API keys (hashed with SHA-256, scope-limited)
```

**Browser sessions:**
- `express-session` with a custom MongoDB store
- Session cookie: `httpOnly: true` (invisible to JavaScript, immune to XSS)
- `SameSite: Strict` in production, `Lax` in development
- **Idle timeout:** 30 minutes (rolling)
- **Absolute timeout:** 7 days (prevents eternal sessions even if idle timeout keeps refreshing)

**Microservice JWTs (`POST /auth/service-token`):**
- Issued on demand from an active browser session
- 5-minute expiry, scoped to a specific audience and action
- Never stored — used immediately for a single service call
- Algorithm pinning (HS256) to prevent algorithm confusion attacks

**API Keys:**
- Generated as `bk_<64 random hex chars>`
- Only the SHA-256 hash is stored in the database (bcrypt would be unnecessary overhead for high-entropy inputs)
- Raw key shown **once** at creation — never retrievable again
- Scope-limited: `items:read`, `items:write`, `admin`
- Optional expiration date

---

## Data Model

```
Tenant
  id, name, slug (unique), plan, isActive, createdAt
  domain?: String      ← set when auto-created from a registrant's email domain (see Multi-Tenancy)
  → has many Users, Items

User
  id, name, surname, email, password (bcrypt hash)
  roles: String[]      ← embedded array, not a junction table
  tenantId?: ObjectId  ← optional tenant membership
  createdAt
  mustResetPassword: Boolean               ← forces a password change before anything else works
  resetPasswordTokenHash?, resetPasswordExpiresAt?  ← "forgot password" token (hashed, 1h TTL)
  → has many ApiKeys, Items

Role
  id, title            ← reference collection for admin UI (not used for auth checks)

Item
  id, title, description, isActive
  tenantId?: ObjectId  ← null = global item
  createdById: ObjectId
  createdAt, updatedAt

Session
  sid (express-session ID used as _id), data, expiresAt, createdAt

ApiKey
  id, userId, label, keyHash (SHA-256), scopes: String[]
  expiresAt?, isActive, createdAt
```

**Why roles are embedded in `User.roles: String[]`:**
A junction table (`UserRole`) adds a DB join on every authenticated request. MongoDB's document model makes embedding the roles array the idiomatic choice — roles are read on every request (from the session), written rarely (admin action), and the set is small.

---

## Role System

| Role | Capabilities |
|---|---|
| `Admin` | Full access to everything — all users, all tenants, all items across all tenants |
| `TenantManager` | Creates users within their own tenant; manages items within their tenant |
| `User` | Creates and manages their own items |

Roles are stored as strings in `User.roles[]`. The `Role` collection exists for admin UI enumeration only — it is not consulted during request authentication (roles come from the session).

**Important:** Role changes take effect on the user's **next login**. The session is a snapshot of roles at login time. For most SaaS products this is acceptable. If you need instant role revocation, add a `rolesUpdatedAt` field to the User and compare it against a `sessionCreatedAt` field to force re-authentication.

---

## Multi-Tenancy

This boilerplate uses **shared collections with tenant isolation** — all tenants share the same MongoDB collections, filtered by `tenantId`. This is the standard approach for small-to-medium SaaS (simpler than database-per-tenant, more scalable than schema-per-tenant).

### Tenant Context Resolution (Priority Order)

Every request resolves its tenant context through `resolveTenant` middleware in this order:

1. **`X-Tenant-ID` header** (slug) — explicit override; useful for admin tools or multi-tenant API clients
2. **`authUser.tenantId`** — implicit; automatically populated from the user's own tenant at login
3. **Neither** — `req.tenant` is `undefined`; item creation/listing operates in global context

This means a TenantManager or regular user assigned to a tenant never needs to send a header — their tenant is resolved automatically.

### Self-Serve Tenant Creation on Signup

`POST /user` derives the registrant's email domain (the part after `@`, lowercased) and decides what to do with it:

- **Domain not seen before, and not a shared public provider** (gmail.com, hotmail.com, etc. — see `backend/src/config/publicEmailDomains.ts`): a new `Tenant` is created automatically (`name`/`slug` derived from the domain), and the registrant becomes its **TenantManager**. This is the "first person from a company signs up and owns the workspace" flow.
- **Domain already has a tenant** (auto-created earlier, or manually tagged by an Admin via the optional `domain` field on `POST /admin/tenants`): registration is rejected with a message to contact the organization's manager instead — `POST /tenant/users` is how that manager actually adds them. This prevents the same company from ending up with two unrelated tenants.
- **Public email provider, or no domain to match**: registration proceeds exactly as before — no tenant, plain `User` role.

The public-provider list is a starting point, not exhaustive — tune it for your market when forking this boilerplate. Race protection for two people from the same new domain signing up at nearly the same time comes from the `Tenant.slug` unique constraint (always derived deterministically from the domain in this path), not from a `domain` uniqueness check — MongoDB unique indexes don't treat multiple missing/null values as distinct the way a Postgres partial-unique index would, and most tenants (public-domain signups, most Admin-created ones) have no `domain` at all.

### Tenant Scoping Behavior

| Route | Behavior |
|---|---|
| `GET /items` | Returns only items matching the resolved tenant (or all if no tenant context) |
| `POST /items` | Assigns the resolved tenant to the new item automatically |
| `GET /admin/users` | Admin sees all users across all tenants |
| `GET /admin/tenants` | Admin manages tenant configuration |
| `POST /tenant/users` | TenantManager creates users pre-assigned to their own tenant |

### Building a Single-Tenant App?

Not every product forked from this boilerplate is a multi-org B2B SaaS — a single-audience app (a book review site, a personal CRM, whatever) has no use for organizations at all. The backend needs **no changes** for this: multi-tenancy stays fully wired, `tenantId` just stays `null` for everyone, and `resolveTenant`/`requireRole(TenantManager)`/the `/admin/tenants` and `/tenant/*` routes simply go unused. There's no config flag for this on purpose — it's a decision you make once at fork time, not a runtime toggle to maintain.

The only thing worth trimming is the tenant-management UI on the frontend, so your users never see screens for a concept your product doesn't have:

- `frontend/src/pages/admin/AdminTenantsListPage.tsx`, `AdminTenantFormPage.tsx`
- `frontend/src/pages/tenant/` (`TenantCreateUserPage.tsx`, `TenantUsersListPage.tsx`)
- The matching routes in `frontend/src/routes/AppRoutes.tsx` (`admin/tenants*`, `tenant/users*`)
- The matching nav links in `frontend/src/layouts/AppLayout.tsx` ("Tenants", "Tenant users", "Add tenant user")
- The tenant-assignment section inside `frontend/src/pages/admin/AdminUserDetailPage.tsx`
- `frontend/src/i18n/locales/*/tenant.json`, and the `tenants.*` keys inside `admin.json`
- `frontend/src/api/{tenants,tenantUsers}.ts`, `frontend/src/queries/{tenants,tenantUsers}.ts`, `frontend/src/types/tenant.ts`

**Also consider:** the [self-serve tenant-per-domain signup flow](#self-serve-tenant-creation-on-signup) will keep creating real `Tenant` documents on every signup from a new email domain even with the UI gone — harmless, but if you want a genuinely tenant-free database, simplify `UserService.createUser` (`backend/src/services/UserService.ts`) to drop that branch and always create plain `User`-role accounts.

---

## API Reference

All responses follow this envelope:

```json
{ "hasError": false, "errors": [], "data": ... }
```

Errors return the same shape with `"hasError": true` and human-readable messages in `"errors"`.

### Public Routes (no authentication)

| Method | Path | Description |
|---|---|---|
| `GET` | `/healthcheck` | Server health check |
| `POST` | `/user` | Register a new user (see [Self-Serve Tenant Creation](#self-serve-tenant-creation-on-signup)) |
| `POST` | `/login` | Authenticate and start a session |
| `POST` | `/logout` | Destroy the current session |
| `POST` | `/auth/forgot-password` | Request a password reset email — always responds 200, never reveals whether the email exists |
| `POST` | `/auth/reset-password` | Complete a password reset using the token from that email (single-use, 1h expiry) |

### Private Routes (session required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/me` | Returns the current authenticated user (includes `mustResetPassword`) |
| `POST` | `/auth/service-token` | Issue a short-lived JWT for a microservice call |
| `POST` | `/auth/change-password` | Change your own password (`currentPassword` + `newPassword`) — the only endpoint besides `/me`/`/logout` reachable while `mustResetPassword` is set |

### Items (session OR API key)

API key access requires the appropriate scope (`items:read` or `items:write`).

| Method | Path | Description |
|---|---|---|
| `GET` | `/items` | List items (paginated, tenant-scoped) |
| `GET` | `/items/:id` | Get a single item |
| `POST` | `/items` | Create an item |
| `PATCH` | `/items/:id` | Update an item (owner or admin) |
| `DELETE` | `/items/:id` | Delete an item (owner or admin) |

Query params: `?page=1&limit=10`
Header: `X-Tenant-ID: <slug>` (optional — auto-resolved from user's tenant if omitted)

### API Keys (session only — cannot use an API key to manage API keys)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api-keys` | Create a new API key — raw key shown once only |
| `GET` | `/api-keys` | List all API keys for the current user |
| `DELETE` | `/api-keys/:id` | Revoke (deactivate) an API key |

### Admin Routes (session + Admin role required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/roles` | List all available roles |
| `GET` | `/admin/users` | List all users (paginated) |
| `GET` | `/admin/users/:id` | Get a specific user |
| `POST` | `/admin/users/:id/roles` | Add a role to a user |
| `DELETE` | `/admin/users/:id/roles/:role` | Remove a role from a user |
| `POST` | `/admin/users/:id/tenant` | Assign a tenant to a user |
| `GET` | `/admin/tenants` | List all tenants (paginated) |
| `POST` | `/admin/tenants` | Create a new tenant |
| `PATCH` | `/admin/tenants/:id` | Update a tenant |

### Tenant Routes (session + TenantManager or Admin role required)

| Method | Path | Description |
|---|---|---|
| `POST` | `/tenant/users` | Create a user pre-assigned to the manager's tenant |
| `GET` | `/tenant/users` | List users in a tenant (paginated) |

**TenantManager:** `tenantId` (body for `POST`, query for `GET`) is ignored — always the manager's own tenant.
**Admin:** Can pass `tenantId` (body for `POST`, query param for `GET`) to target any tenant; falls back to their own tenant if omitted.

---

## Project Structure

```
React-Node-Boilerplate/
├── docker-compose.yml              # Local dev only: backend + a local MongoDB replica set
├── backend/
│   ├── Dockerfile                 # Multi-stage: deps → dev/build → production
│   ├── prisma/
│   │   └── schema.prisma          # Data model (Tenant, User, Role, Item, Session, ApiKey)
│   └── src/
│       ├── config/
│       │   ├── corsOptions.ts     # CORS whitelist (never wildcard + credentials)
│       │   ├── logger.ts          # Pino structured logger
│       │   ├── mailer.ts          # Nodemailer transport from SMTP_* env vars
│       │   ├── publicEmailDomains.ts  # Providers excluded from auto-tenant-creation
│       │   ├── roles.ts           # Role enum (Admin, TenantManager, User)
│       │   └── swagger.ts         # Swagger spec config
│       ├── controllers/
│       │   ├── AdminController.ts
│       │   ├── ApiKeyController.ts
│       │   ├── ItemController.ts
│       │   └── UserController.ts
│       ├── errors/
│       │   └── AppError.ts        # Operational error class
│       ├── middleware/
│       │   ├── blockIfMustResetPassword.ts  # 403 on every route except /me, /logout, /auth/change-password
│       │   ├── errorHandler.ts    # Centralized error handler
│       │   ├── rateLimiter.ts     # Auth: 10 req/15min, API: 100 req/min
│       │   ├── requireAuth.ts     # Session OR API key (scope-aware)
│       │   ├── requireRole.ts     # Role-based access guard
│       │   ├── requireSession.ts  # Session-only guard
│       │   ├── resolveTenant.ts   # Resolves tenant context (header → user → none)
│       │   ├── validateBody.ts    # Zod body + query validation
│       │   └── verifyApiKey.ts    # API key-only guard
│       ├── routes/
│       │   ├── publicRoutes.ts    # /user, /login, /logout, /healthcheck
│       │   ├── privateRoutes.ts   # /me, /auth/service-token
│       │   ├── itemRoutes.ts      # mounted at /items
│       │   ├── apiKeyRoutes.ts    # mounted at /api-keys
│       │   ├── adminRoutes.ts     # mounted at /admin
│       │   └── tenantRoutes.ts    # mounted at /tenant
│       ├── schemas/
│       │   ├── userSchema.ts      # CreateUserSchema, LoginSchema, CreateUserInTenantSchema
│       │   ├── authSchema.ts      # ChangePasswordSchema, ForgotPasswordSchema, ResetPasswordSchema
│       │   ├── itemSchema.ts      # CreateItemSchema, UpdateItemSchema, PaginationSchema
│       │   ├── apiKeySchema.ts    # CreateApiKeySchema, AVAILABLE_SCOPES
│       │   ├── tenantSchema.ts    # CreateTenantSchema, UpdateTenantSchema (both take an optional domain)
│       │   └── adminSchema.ts     # AddRoleSchema, AssignTenantSchema
│       ├── services/
│       │   ├── UserService.ts     # createUser (+ auto-tenant), login, changePassword, requestPasswordReset, resetPassword
│       │   ├── SessionService.ts  # populate, destroy, getUser
│       │   ├── AdminBootstrapService.ts  # ensureInitialAdmin — seeds/promotes Admin from INITIAL_ADMIN_* on boot
│       │   ├── EmailService.ts    # sendPasswordResetEmail
│       │   ├── JwtService.ts      # issueServiceToken, verifyServiceToken
│       │   ├── ItemService.ts     # list, getById, create, update, delete
│       │   ├── ApiKeyService.ts   # create, listByUser, revoke, verify
│       │   ├── TenantService.ts   # create, list, getBySlug, getById, update
│       │   ├── AdminService.ts    # listRoles, listUsers, getUser, addRole, removeRole, assignTenant
│       │   └── RoleService.ts     # verifyDBRoles (syncs enum → DB at startup)
│       ├── store/
│       │   └── SessionStore.ts    # Custom express-session store backed by MongoDB via Prisma
│       └── types/
│           ├── express.d.ts       # Augments Express.Request with authUser, tenant
│           └── session.d.ts       # Augments express-session SessionData with tenantId, roles, etc.
└── frontend/                      # React + Vite SPA — Dockerfile + nginx.conf are optional, for self-hosting (see Deployment)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (free tier works fine) — **or** Docker, to run a local MongoDB instead (see [Alternative: Docker Compose](#alternative-docker-compose) below)

### 1. Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/React-Node-Boilerplate.git
cd React-Node-Boilerplate/backend
npm install
```

### 2. Configure environment

Create `backend/.env` from the template below:

```env
# MongoDB Atlas connection string
# IMPORTANT: include the database name between "/" and "?"
# Example: mongodb+srv://user:pass@cluster.mongodb.net/mydb?retryWrites=true&w=majority
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority&appName=<AppName>"

# Session secret — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=your_256bit_random_secret_here

# CORS — space-separated list of allowed origins (no wildcards)
ALLOWED_ORIGINS=http://localhost:5173

# JWT — for microservice tokens only (never used for browser sessions)
JWT_SERVICE_SECRET=your_256bit_random_secret_here
JWT_ISSUER=boilerplate-api

# Server port (default: 8081)
API_PORT=8081

# Set to "production" to enable secure cookies and disable Swagger UI
NODE_ENV=development

# Optional: skip password strength validation during development/testing
# BYPASS_PASSWORD_STRENGTH_VALIDATION=true

# Frontend URL — used to build links inside emails (e.g. password reset)
FRONTEND_URL=http://localhost:5173

# Bootstrap Admin — created automatically on first boot if no Admin user exists yet.
# See "Create your first Admin user" below.
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=choose_a_real_password_here

# SMTP — required for the "forgot password" email. Any provider works
# (Gmail app password, Mailtrap/Ethereal for local dev, SES/SendGrid SMTP relay
# in prod) — this is a plain Nodemailer transport config, no vendor SDK.
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=no-reply@yourapp.com
```

### 3. Push schema to MongoDB

```bash
npx prisma db push
```

This creates the collections and indexes. No migration files — Prisma handles MongoDB schema changes via `db push`.

### 4. Start the server

```bash
npm run dev
```

The server starts on `http://localhost:8081`. Swagger UI is available at `http://localhost:8081/docs`.

### 5. Create your first Admin user

On first boot, if no `Admin` user exists yet, the server automatically creates one from `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` in your `.env` — no manual database edit needed, and no password to fish out of a console log during deploy (you already know it, you set it).

1. Set `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` in `.env` before starting the server for the first time.
2. Start the server (`npm run dev`) — check the logs for `Created initial Admin user: <email>`.
3. Log in with those credentials. The account is created with `mustResetPassword: true`, so the very first authenticated request other than `GET /me`, `POST /logout`, or `POST /auth/change-password` is rejected with `403 Password reset required` — call `POST /auth/change-password` to set your own password before doing anything else.
4. If `INITIAL_ADMIN_EMAIL` happens to match an existing user (e.g. you registered yourself normally first), that account is promoted to `Admin` in place instead — its password is left untouched and `mustResetPassword` is not set.

This only ever runs once: as soon as any `Admin` exists, the bootstrap is a permanent no-op on every subsequent boot, even if `INITIAL_ADMIN_*` is still set.

### Alternative: Docker Compose

Don't want to set up an Atlas cluster just to try this out? `docker compose up` runs the backend against a local, throwaway MongoDB instead — no account, no cloud dependency:

```bash
docker compose up
```

This still reads `backend/.env` for everything except `DATABASE_URL` (which gets pointed at the local Mongo container automatically) — so you still need steps 1–2 above (a `.env` file must exist), but can skip creating an Atlas cluster and skip `npx prisma db push` (the collections get created on first write). Source changes hot-reload the same as `npm run dev`, since the container just runs that with your `backend/` folder mounted in.

The frontend is **not** included in `docker-compose.yml` — run it natively (`npm run dev` inside `frontend/`) for Vite's instant hot reload; containerizing it would only slow that down. This setup is for local development only — see [Deployment](#deployment) for production.

---

## Email Delivery

The backend sends email through a single plain SMTP transport (Nodemailer, `backend/src/config/mailer.ts`) — used today by `EmailService.sendPasswordResetEmail` for the forgot-password flow. There's no vendor SDK baked in, so any provider that hands you SMTP credentials works with **zero code changes** — just fill in `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM` in `.env`.

**Drop-in via SMTP (recommended, no code changes):**

| Provider | Why you'd pick it |
|---|---|
| [Resend](https://resend.com) | Best default for a fresh project — generous free tier, painless domain verification, an SMTP relay alongside its API |
| [Amazon SES](https://aws.amazon.com/ses/) | Cheapest at real scale; starts in a sandbox restricted to verified recipients until you request production access |
| [Postmark](https://postmarkapp.com), [Mailgun](https://www.mailgun.com), [SendGrid](https://sendgrid.com) | Mature, all SMTP-capable, largely interchangeable — pick whichever your team already has a relationship with |
| [Mailtrap](https://mailtrap.io) / [Ethereal](https://ethereal.email) | Not for production — a fake inbox for local dev, so test emails never risk reaching a real address |

**If you also want push notifications, in-app messages, or SMS (not just email): [OneSignal](https://onesignal.com)**
OneSignal is a broader customer-engagement platform (push + email + SMS + in-app) rather than a plain SMTP relay — its email product is driven through their API/dashboard, not SMTP credentials. Adopting it means replacing the Nodemailer call inside `EmailService` with their SDK instead of just editing `.env`. Worth it if you're already planning to use OneSignal for other notification channels in your product; overkill if all you need is transactional email.

---

## Deployment

`docker-compose.yml` (above) is for local development only. In production, MongoDB stays on Atlas — nothing here teaches you to self-host Mongo, since the rest of this README already assumes Atlas throughout.

### Environment checklist

Before deploying, make sure production has its own values (never reuse dev secrets) for:

- `NODE_ENV=production` — enables secure cookies (`secure: true`, `sameSite: strict`) and disables Swagger UI
- `DATABASE_URL` — your production Atlas connection string
- `SESSION_SECRET`, `JWT_SERVICE_SECRET` — fresh random secrets, not the ones from your `.env.example`
- `ALLOWED_ORIGINS` — the real deployed frontend origin(s), space-separated (no wildcards — see [Philosophy](#philosophy))
- `FRONTEND_URL` — used to build links in emails (e.g. the password-reset link)
- `SMTP_*` — a real provider, not Ethereal/Mailtrap (see [Email Delivery](#email-delivery))
- `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` — set for the first deploy only; see [Create your first Admin user](#5-create-your-first-admin-user)

### Backend

**Option A — Deploy the Docker image.** Build the `production` target from `backend/Dockerfile` and run it on any container host (Fly.io, Railway, Render, AWS/GCP/Azure container services, a bare VM with Docker, etc.):

```bash
docker build --target production -t your-registry/boilerplate-backend ./backend
docker run -p 8081:8081 --env-file backend/.env your-registry/boilerplate-backend
```

**Option B — Deploy without Docker**, on any platform that runs a Node app directly (Render, Railway, a VM, etc.) using the scripts already in `backend/package.json`:

```bash
npm ci
npm run build   # tsc -> dist/
npm start       # node dist/index.js
```

Either way, run `npx prisma db push` once against your production `DATABASE_URL` before the first deploy (there are no migration files — see [Push schema to MongoDB](#3-push-schema-to-mongodb)).

### Frontend

**Option A — Static hosting (recommended).** The build output (`npm run build` → `frontend/dist/`) is a plain static bundle — Vercel, Netlify, and Cloudflare Pages all deploy it directly. Set `VITE_API_URL` to your production backend URL as a build-time environment variable on whichever host you pick, and configure it for **SPA fallback** (all unmatched paths serve `index.html`) — React Router handles routes like `/app/items` client-side, so a direct hit on that URL must not 404. Most static hosts have a one-line config for this (e.g. a rewrite rule); check your host's docs.

**Option B — Self-host with the provided Nginx image** (`frontend/Dockerfile`), already configured for SPA fallback:

```bash
docker build --build-arg VITE_API_URL=https://api.yourapp.com -t your-registry/boilerplate-frontend ./frontend
docker run -p 8080:80 your-registry/boilerplate-frontend
```

`VITE_API_URL` is baked into the JS bundle at build time (Vite env vars aren't readable at runtime) — rebuild the image if it changes.

### Cross-origin cookies in production

Production cookies are `secure: true` + `sameSite: strict` (see [Authentication Architecture](#authentication-architecture)). `sameSite: strict` means the session cookie is only sent on same-site requests — if your frontend and backend end up on genuinely different sites (not just different subdomains of the same registrable domain), cross-site navigations won't carry the cookie. Put both under the same parent domain (e.g. `app.yourproduct.com` and `api.yourproduct.com`) to avoid surprises, and make sure `ALLOWED_ORIGINS` lists the frontend's exact deployed origin (scheme + host + port) — CORS rejects anything not on that list regardless of cookie settings.

---

## Key Implementation Notes

### Express 5 Compatibility

This boilerplate uses Express 5, which has two important differences from Express 4:

1. **`req.query` is read-only** — do not attempt to reassign it. Zod validation via `validateQuery` validates the query params but does not mutate them. Controllers re-parse with `PaginationSchema.parse(req.query)` to get coerced values.

2. **Async errors propagate automatically** — no need for `try/catch` in route handlers or `next(err)` wrappers. Any thrown error (including `AppError`) is automatically forwarded to the error handler middleware.

### Router Path Prefixes (Critical Pattern)

All private routers are mounted with a path prefix in `index.ts`:

```typescript
app.use('/items', itemRoutes);
app.use('/api-keys', apiKeyRoutes);
app.use('/admin', adminRoutes);
app.use('/tenant', tenantRoutes);
```

**Do not remove these prefixes.** Express passes a request to a router only if the request path matches the prefix. Without prefixes, router-level middleware (like `requireRole`) runs for all requests — including those destined for other routers — and can return 403/401 responses prematurely.

### Adding New Domain Entities

To add a new resource (e.g., `Project`) following the existing patterns:

1. Add the model to `prisma/schema.prisma`
2. Run `npx prisma db push && npx prisma generate`
3. Create `src/schemas/projectSchema.ts` (Zod)
4. Create `src/services/ProjectService.ts` (Prisma queries)
5. Create `src/controllers/ProjectController.ts`
6. Create `src/routes/projectRoutes.ts` (mount at `/projects`)
7. Mount in `src/index.ts`: `app.use('/projects', projectRoutes)`

### Extending the Role System

Add a new role in `src/config/roles.ts`:

```typescript
enum Role {
  ADMIN = "Admin",
  TENANT_MANAGER = "TenantManager",
  YOUR_ROLE = "YourRole",   // add here
  USER = "User",
}
```

`RoleService.verifyDBRoles()` runs at startup and automatically creates missing roles in the database.

---

## Roadmap

- [x] Phase 1 — Backend foundation (auth, sessions, JWT, security headers, logging, Swagger)
- [x] Phase 2 — CRUD template, API Keys, multi-tenancy, role system
- [x] Phase 3 — Frontend foundation (React Router v7, Axios with session interceptors, Zustand auth store)
- [x] Phase 4 — Frontend pages (login, register, dashboard, admin panel, profile, API key management)
- [x] Phase 5 — Docker Compose, production deployment guide

---

## AI Context: Briefing for AI Assistants

> If you forked this boilerplate and are using an AI assistant to continue development, paste this section (or the entire README) at the start of your conversation. It documents the non-obvious decisions that the AI needs to respect.

### Hard Constraints — Do Not Change Without Understanding Why

**Authentication:**
- Browser sessions use `express-session` with httpOnly cookies. **Never replace this with JWT stored in cookies or localStorage** for browser auth.
- The `POST /auth/service-token` endpoint issues JWTs exclusively for microservice-to-microservice calls. These tokens must remain ≤ 5 minutes and single-purpose. This is not a "user JWT" — it is a machine token.
- `requireSession` and `requireAuth` both set `req.authUser` (shape: `{ id, email, roles, tenantId?, scopes, authMethod }`). All controllers read from `req.authUser` — never from `SessionService.getUser()` directly in controllers.

**API Keys:**
- Only the SHA-256 hash of an API key is stored in the database. The raw key is returned once at creation and never again. **Do not add a "view key" endpoint.**
- `ApiKeyService.verify()` returns `{ userId, email, roles, scopes }`. Note the field is `userId`, not `id` — middleware maps it to `id` when building `req.authUser`.

**Routing:**
- All private routers are mounted with path prefixes (`/items`, `/api-keys`, `/admin`, `/tenant`). This is not optional — it prevents router-level middleware from intercepting requests meant for other routers.
- `publicRoutes` and `privateRoutes` are mounted without a prefix because their routes have no common prefix (`/healthcheck`, `/user`, `/login`, `/logout`, `/me`, `/auth/service-token`).

**Express 5:**
- `req.query` is read-only (getter-only property). Do not assign to it. The `validateQuery` middleware validates but does not mutate `req.query`. Controllers call `PaginationSchema.parse(req.query)` directly.
- Async route handlers do not need `try/catch`. Express 5 forwards thrown errors to `errorHandler` automatically.

**Tenant resolution:**
- `resolveTenant` middleware (applied to `itemRoutes`) resolves tenant context in this priority: `X-Tenant-ID` header → `authUser.tenantId` (from session) → `undefined`. It runs before auth on item routes, so it may run before `req.authUser` is set — the fallback to `authUser.tenantId` only happens if `authUser` exists.

**Password reset / forced reset:**
- `resetPasswordTokenHash` must never be stored or logged as the raw token — only its SHA-256 hash. The raw token exists only inside the email sent by `EmailService.sendPasswordResetEmail` and briefly in the request body of `POST /auth/reset-password`.
- `mustResetPassword` lives in the session (`SessionService.populate`/`getUser`), not just the database — it's set at login time from the DB and cleared in-place on the current session object by `POST /auth/change-password`, so the gate lifts immediately without requiring re-login. **Do not** move this check to a per-request DB read; that was a deliberate tradeoff to keep session auth fast.
- `blockIfMustResetPassword` must stay wired into every router that isn't explicitly exempt (`itemRoutes`, `apiKeyRoutes`, `adminRoutes`, `tenantRoutes`, and the `/auth/service-token` handler). The only reachable endpoints while the flag is set are `GET /me`, `POST /logout`, and `POST /auth/change-password` — adding a new authenticated router means adding this middleware to it too.
- `Tenant.domain` is intentionally **not** `@unique` in `schema.prisma` — see [Self-Serve Tenant Creation on Signup](#self-serve-tenant-creation-on-signup) for why a Postgres-style sparse-unique assumption breaks on MongoDB here.

### Current Middleware Stack (in order for a request to `POST /items`)

```
helmet → cors → express.json → session →
publicRoutes (no match) →
privateRoutes: requireSession (passes, user authenticated) →
itemRoutes (mounted at /items):
  resolveTenant → requireAuth('items:write') → validateBody(CreateItemSchema) → ItemController.create
→ errorHandler
```

### Session Shape

```typescript
// express-session SessionData (session.d.ts)
{
  userId: string;
  email: string;
  roles: string[];       // snapshot at login — changes require re-login
  tenantId?: string;     // undefined if user has no tenant
  mustResetPassword?: boolean; // cleared in-place by POST /auth/change-password, no re-login needed
  absoluteExpiry: number; // epoch ms — 7 days from login
}
```

### AuthUser Shape (req.authUser)

```typescript
// express.d.ts
{
  id: string;
  email: string;
  roles: string[];       // from session or API key's user record
  tenantId?: string;     // only present for session auth; undefined for API key auth
  scopes: string[];      // [] for session auth; API key scopes for apikey auth
  authMethod: 'session' | 'apikey';
}
```

### Error Response Shape

All errors follow:
```json
{ "hasError": true, "errors": ["Human readable message"] }
```

`AppError(statusCode, message)` is the operational error class. Thrown `AppError` instances are caught by `errorHandler` and returned with their status code. Unknown errors return 500 (with the message exposed only in development).
