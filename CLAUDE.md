# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev           # Start Next.js + Convex dev servers concurrently
pnpm build         # Production build
pnpm lint          # Run ESLint
pnpm typecheck     # TypeScript type checking
pnpm check         # Run both lint and typecheck
pnpm format        # Format code with Prettier
pnpm format:check  # Check formatting without writing
```

Add shadcn components:

```bash
pnpx shadcn@latest add <component-name>
```

## Architecture

This is a Next.js 16 fitness tracking application with Convex as the backend.

### Stack

- **Frontend**: Next.js 16 with App Router, React 19, React Compiler enabled
- **Backend**: Convex (real-time database and serverless functions)
- **Auth**: @convex-dev/auth with Password provider
- **UI**: shadcn/ui (new-york style), Tailwind CSS v4, Radix primitives
- **Charts**: Recharts

### Project Structure

```
src/
├── app/
│   ├── (auth)/         # Sign-in/sign-up pages (public)
│   ├── (dashboard)/    # Protected routes with sidebar layout
│   └── layout.tsx      # Root layout with providers
├── components/
│   ├── ui/             # shadcn components
│   ├── auth/           # Auth forms
│   ├── measurements/   # Measurement entry forms
│   ├── goals/          # Goal tracking components
│   └── gpx-calculator/ # GPX race pace tool
├── lib/
│   ├── calculations/   # Body fat, fitness, GPX calculations
│   └── unitConversion.ts
└── hooks/

convex/
├── schema.ts           # Database schema (userProfiles, measurements, goals)
├── auth.ts             # Auth configuration
├── measurements.ts     # Measurement queries/mutations
├── goals.ts            # Goal queries/mutations
└── userProfile.ts      # User profile management
```

### Key Patterns

**Path Aliases**: Use `@/` for `src/` imports and `@/convex/` for Convex imports.

**Convex API Usage**: Import the generated API from `@/convex/_generated/api` and use with `useQuery`/`useMutation` hooks from `convex/react`.

**Authentication**: Dashboard routes are protected in the layout with `useConvexAuth()`. Unauthenticated users redirect to `/sign-in`.

**Unit System**: User preferences (kg/lbs, cm/in) stored in `userProfiles` table and respected across the UI.

**Body Fat Calculations**: Four methods implemented in `src/lib/calculations/bodyFat.ts`:

- Navy Method (circumference-based)
- Jackson-Pollock 7-site and 3-site (skinfold)
- Durnin-Womersley (skinfold)

**Data Storage**: All measurements stored in metric (kg, cm, mm). Conversion happens at display/input layer only.
