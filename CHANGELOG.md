# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Community health files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, issue/PR templates, and `CODEOWNERS`.

## [1.0.0] - 2026-06-21

### Added
- Full-stack outreach-automation app: Express 5 + Knex/Postgres backend with
  JWT auth, Zod validation, Pino logging, platform analyzer services, and an
  email-drip service; SvelteKit frontend (dashboard, channel audit, outreach,
  pricing, auth).
- Docker Compose stack (Postgres + Redis + backend + frontend + Caddy).
- GitHub Actions CI (Node 22): `npm ci`, build (tsc + vite), typecheck, tests.
- Committed `package-lock.json` for reproducible installs.

### Fixed
- Backend TypeScript build: Pino logger argument order `(obj, msg)`; Twitter
  analyzer null guard.
- Frontend build: escaped a literal `<` that Svelte parsed as a tag.

[Unreleased]: https://github.com/Amarel-Taylor-Scott/sponsoragent/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Amarel-Taylor-Scott/sponsoragent/releases/tag/v1.0.0
