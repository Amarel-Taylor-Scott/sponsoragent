# Contributing to SponsorAgent

Thanks for your interest in contributing! This guide covers setup, the quality
bar, and how to propose changes.

## Development setup

Requires **Node 22+**. The repo is an npm workspaces monorepo (backend +
frontend).

```bash
git clone https://github.com/Amarel-Taylor-Scott/sponsoragent.git
cd sponsoragent
npm install                  # installs both workspaces
cp .env.example .env         # set DATABASE_URL, REDIS_URL, JWT_SECRET, STRIPE_*, ...
```

Running the full app needs Postgres + Redis and is Docker-first:

```bash
npm run dev                  # docker compose up -d --build
npm run dev:logs
npm run dev:down
```

## Project layout

| Path | Stack |
|------|-------|
| `backend/` | Express 5 + Knex/Postgres, JWT auth, Zod, Pino, analyzer services |
| `frontend/` | SvelteKit + Svelte 4 + Vite |
| `docker-compose.yml` | Postgres + Redis + backend + frontend + Caddy |

## Before you open a PR

Mirror CI (`.github/workflows/ci.yml`):

```bash
npm ci
npm run build                # backend tsc + frontend vite
npm run lint                 # typecheck both workspaces
npm test --workspaces --if-present
```

- Keep TypeScript strict-clean — `npm run build` and `npm run lint` must pass.
- Use Pino's `(obj, msg)` argument order for structured logs.
- For Svelte, avoid `bind:value` on inputs with a dynamic `type` (use
  `value=` + `on:input`); escape literal `<` in markup as `&lt;`.
- Add/adjust tests for behavior you change; update `CHANGELOG.md` for
  user-facing changes.

## Pull request process

1. Fork and branch (`feat/...` or `fix/...`).
2. Make the change; keep it focused.
3. Run the checks above (build + typecheck green).
4. Open a PR using the template and describe how you verified it.

## Reporting

Use the issue templates for bugs/features. For security issues, see
[SECURITY.md](SECURITY.md). Never commit `.env`, secrets, or `node_modules`.
