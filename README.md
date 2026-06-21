# SponsorAgent

SponsorAgent is a private full-stack outreach automation product for creator
and sponsor workflows. The repo contains a TypeScript/Express backend, a
SvelteKit frontend, analyzer services, database migrations, Dockerfiles,
Compose config, Caddy config, and a Makefile.

## Current Shape

```text
sponsoragent/
├── backend/        Express API, migrations, v1 routes, analyzer services,
│                   email-drip service, Stripe-aware app setup
├── frontend/       SvelteKit app with dashboard, channel, outreach, audit,
│                   pricing, login/signup, and platform-specific routes
├── docker-compose.yml
├── Caddyfile
├── Makefile
└── package.json
```

## Scripts

The root package uses workspaces and requires Node 22 or newer.

```bash
npm run build
npm run lint
npm test
```

Development is Docker-first:

```bash
npm run dev
npm run dev:down
npm run dev:logs
```

## Verification Snapshot

Last static inventory pass: 2026-05-24.

- Package manifests were parsed.
- Source shape was inspected: 58 files under `backend/src` and `frontend/src`.
- Runtime commands were not run because this app uses Docker, databases,
  checkout/webhook paths, outreach flows, and external platform integrations.

## Operational Boundaries

During broad ecosystem cleanup, prefer static checks and manifest parsing. Do
not run Docker, migrations, seeders, checkout, webhook, email, outreach,
platform analyzer, or deployment commands unless the session is explicitly
scoped for application verification.

## Related Repos

- `leadova` is an adjacent lead-generation product using a similar stack.
- `agency_email_scraper` is adjacent lead-source infrastructure.
- `ai_influencer_auto_bot` and `social_media_automation` are adjacent
  automation surfaces.
