# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email **cody@leffel.io** with details of the vulnerability
3. Include steps to reproduce if possible

You should receive a response within 48 hours. We'll work with you to understand the issue and coordinate a fix before any public disclosure.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0   | No        |

## Security Considerations

- **API Keys**: Never commit `.env.local` or any file containing real credentials. Use `.env.example` as a template.
- **Supabase RLS**: All database tables use Row Level Security policies. Users can only access their own data.
- **SSRF Protection**: The recipe import API validates URLs and blocks requests to private IP ranges.
- **Input Validation**: User inputs are validated with Zod at system boundaries.
- **Security Headers**: The app sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers.
