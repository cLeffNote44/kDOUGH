# KaitohDough

## Overview
AI-powered Electron desktop application built with Next.js 16 and the Anthropic SDK.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + Electron 40.8
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI:** Anthropic SDK (Claude)
- **Database:** Supabase
- **Scraping:** Cheerio
- **Validation:** Zod
- **Notifications:** Sonner
- **Testing:** Vitest
- **Build:** electron-builder (macOS dmg, universal binary)
- **Package Manager:** npm

## Commands
```bash
# Development
npm run dev              # Next.js dev server
npm run electron:dev     # Electron dev mode

# Building
npm run build            # Next.js production build
npm run electron:build   # Package Electron app
npm run electron:build:dir  # Package without installer

# Testing
npm run test             # Run tests
npm run test:watch       # Tests in watch mode

# Linting
npm run lint             # ESLint
```

## Architecture
- Electron main process wraps a Next.js app
- App source is in `app/` subdirectory
- Anthropic SDK for AI capabilities
- Cheerio for web scraping/data extraction
- Supabase for backend/auth
- electron-builder configured for macOS universal binary
- Environment variables in `.env.local` (see `.env.example`)
