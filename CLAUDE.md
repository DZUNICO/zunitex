# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**STARLOGIC** — A professional social network for electricians and related professionals (corporate pros, retailers, distributors, manufacturers, buyers, students). Built with Next.js App Router, Firebase, React Query 5, and TypeScript.

## Commands

### Frontend (root)
```bash
npm run dev        # Dev server on port 3000
npm run build      # Production build
npm run lint       # ESLint
```

### Cloud Functions (`functions/`)
```bash
npm --prefix functions run build          # TypeScript compile
npm --prefix functions run lint           # ESLint
npm --prefix functions run start          # Firestore + Functions emulator
npm --prefix functions run test           # Jest tests
npm --prefix functions run test:watch     # Watch mode
npm --prefix functions run deploy         # Deploy to Firebase
npm --prefix functions run migrate:users  # Run user migration script
```

### Firestore Backup
```bash
npm run backup          # Backup to GCS
npm run backup:restore  # Restore from GCS
npm run backup:list     # List available backups
```

## Architecture

### Route Groups (App Router)
- `src/app/(auth)/` — Unauthenticated pages: login, register, forgot-password
- `src/app/(protected)/` — Requires auth: dashboard, admin, projects, profile, settings
- `src/app/(public)/` — No auth required: blog, community
- `src/app/api/` — Backend API routes

### Provider Stack (root layout)
`GlobalErrorBoundary → NavigationProgress → QueryProvider → AuthProvider`

### Authentication & Roles
Firebase Auth + custom JWT claims. Claims are set by Cloud Function (`functions/src/triggers/user-claims.ts`) on user create and on Firestore document update.

Role hierarchy (in `src/types/roles.ts`):
- `admin` → full access
- `moderator` → can moderate/delete content
- `corporate_pro` → can give training
- `verified_seller` → can publish resources
- `verified_pro` → professional verification badge
- `user` → default

The `AuthContext` (`src/lib/context/`) exposes `user`, `userRole`, `isAdmin`. Use `useCustomClaims` hook to read raw JWT claims. Use `useRolePermissions` hook for permission checks in components.

### Data Layer (React Query)
- **Query keys**: centralized factory in `src/lib/react-query/constants.ts`
- **Query hooks**: `src/lib/react-query/queries/use-*.ts`
- **Mutation hooks**: `src/lib/react-query/mutations/use-*-mutations.ts`
- **Firebase helpers**: `src/lib/firebase/` (one file per collection/domain)
- **Defaults**: `staleTime: 5min`, `gcTime: 10min`, `retries: 3` with exponential backoff

### Cloud Functions (`functions/src/`)
- `triggers/` — Firestore & Auth triggers (counters, claims sync, like counts)
- `callable/` — Client-callable functions (e.g., `refresh-token.ts`)
- `scheduled/` — Cron jobs (backup)
- `scripts/` — One-off migration scripts
- `custom-claims.ts` — Claims management logic shared across triggers

### Firestore Collections
`users`, `projects`, `comments`, `blog-posts`, `blog-comments`, `blog-likes`, `community-posts`, `post-comments`, `post-likes`, `followers`, `reviews`, `user-ratings`, `resources`, `resource-likes`

Security rules live in `firestore.rules` (Rules v2). Helper functions (`isAdmin()`, `hasRole()`, `canModerate()`, `canPublishResources()`, `isOwner()`) are defined at the top of the rules file and reused throughout.

## Key Conventions

**Forms**: React Hook Form + Zod resolver. Schemas live in `src/lib/validations/`.

**Styling**: TailwindCSS + shadcn/ui (`src/components/ui/`). Use `cn()` (tailwind-merge + clsx) for conditional classes. Component variants use CVA.

**Error handling**: Firebase error codes are translated to user-friendly messages in `src/lib/error-handler.ts`. Sentry captures unhandled errors via `QueryProvider` and the global error boundary.

**TypeScript**: Strict mode. `noEmit: true` in tsconfig. Note: `next.config.ts` has `typescript.ignoreBuildErrors: true` — do not rely on this; fix type errors.

**Logging**: Use `src/lib/utils/logger.ts` instead of `console.log` directly.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
```

Cloud Functions use Application Default Credentials (service account) in production; no extra env vars needed in `functions/`.
