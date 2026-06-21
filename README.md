# SponsorAgent

[![CI](https://github.com/Amarel-Taylor-Scott/sponsoragent/actions/workflows/ci.yml/badge.svg)](https://github.com/Amarel-Taylor-Scott/sponsoragent/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node 22+](https://img.shields.io/badge/node-22+-green.svg)](https://nodejs.org/)

SponsorAgent is a full-stack outreach-automation app for creator/sponsor
workflows: paste a channel, get an AI sponsorship audit, and run outreach. It
pairs a TypeScript/Express API with a SvelteKit frontend, analyzer services,
database migrations, and Docker/Caddy deployment config.

## Architecture

```text
sponsoragent/
├── backend/        Express 5 API (TypeScript, ESM), Knex/Postgres migrations,
│                   v1 routes, platform analyzer services, email-drip service,
│                   JWT auth, Stripe-aware app setup
├── frontend/       SvelteKit app — dashboard, channel audit, outreach,
│                   pricing, login/signup, platform-specific routes
├── docker-compose.yml   Postgres + Redis + backend + frontend + Caddy
├── Caddyfile
├── Makefile
└── package.json         npm workspaces (backend + frontend), Node 22+
```

Stack: **Express 5 · Knex · Postgres · Redis (ioredis) · JWT · Stripe · Zod ·
Pino** (backend) and **SvelteKit · Svelte 4 · Vite · TypeScript** (frontend).

## Build & develop

```bash
npm install            # installs both workspaces (Node 22+)
npm run build          # builds backend (tsc) and frontend (vite) — CI-verified
npm run lint           # typecheck both workspaces
npm test               # workspace tests (vitest)
```

Running the full app (API + DB + outreach flows) is Docker-first and needs
Postgres and Redis:

```bash
cp .env.example .env   # set DATABASE_URL, REDIS_URL, JWT_SECRET, STRIPE_*, etc.
npm run dev            # docker compose up -d --build
npm run dev:logs
npm run dev:down
```

> CI verifies install + build + typecheck. Runtime paths (migrations, Stripe
> checkout/webhooks, email/outreach, platform analyzers) require a database and
> external credentials and are not exercised in CI.

## Related repos

- `leadova` — adjacent lead-generation product on a similar stack.
- `social_media_automation` — adjacent posting/automation surface.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the
build/typecheck bar, and the PR process, and note our
[Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately per
[SECURITY.md](SECURITY.md). Release history is in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © Amarel Taylor Scott
