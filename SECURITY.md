# Security Policy

## Supported versions

Security fixes are applied to the latest `master`.

| Version | Supported |
|---------|-----------|
| latest `master` | ✅ |
| older tags | ❌ |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email **amarel.taylor.s@gmail.com** with a description, reproduction steps, and
any suggested fix. You can expect an acknowledgement within a few days, after
which we'll coordinate a fix and disclosure.

## Handling secrets

This app uses a database, JWT auth, and Stripe. Secrets (`DATABASE_URL`,
`JWT_SECRET`, `STRIPE_*`, etc.) live in `.env` and must never be committed —
`.env` is gitignored. If you find a secret accidentally committed, report it
privately via the email above rather than opening a public issue.
