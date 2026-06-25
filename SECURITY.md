# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Report privately via either:
   - GitHub's private vulnerability reporting (repo **Security → Report a vulnerability**), or
   - Email **cody@leffel.io**
3. Include steps to reproduce if possible

You should receive a response within 48 hours. We'll work with you to understand the issue and coordinate a fix before any public disclosure.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0   | No        |

## Security Considerations

- **API Keys**: Never commit `.env.local` or any file containing real credentials. Use `.env.example` as a template.
- **Supabase RLS**: Every table is scoped by Row Level Security so users can only access their own data (recipes, meal plans, grocery lists, and grocery items are all owner-scoped).
- **SSRF Protection**: The recipe import path validates URLs and blocks private/internal IP ranges, re-checking on every redirect hop (see `app/src/lib/import/ssrf.ts`).
- **Input Validation**: User inputs are validated with Zod at system boundaries; AI extraction uses structured tool output with untrusted page content isolated from instructions.
- **Security Headers**: The app sets `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers.
