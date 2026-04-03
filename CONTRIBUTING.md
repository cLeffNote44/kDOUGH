# Contributing to kDOUGH

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repo
2. `cd kDOUGH/app && npm install`
3. Copy `app/.env.example` to `app/.env.local` and fill in your Supabase credentials
4. `npm run dev` to start the dev server

See [README.md](README.md) for full setup instructions.

## Making Changes

1. Create a branch from `develop`: `git checkout -b feat/your-feature develop`
2. Make your changes
3. Run `npm run lint` and `npm run test` to verify
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(scope): add new feature`
   - `fix(scope): fix a bug`
   - `docs(scope): update documentation`
5. Push your branch and open a PR against `develop`

## Branch Strategy

- `main` — stable releases, tagged with semver
- `develop` — active development, PRs target this branch
- `feat/*`, `fix/*` — short-lived feature/fix branches

## Code Style

- TypeScript strict mode
- Functional components with hooks (no class components)
- Tailwind CSS for styling
- ESLint for linting (`npm run lint`)

## Reporting Bugs

Open a [GitHub Issue](../../issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS info if relevant

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind and constructive.
