# My Fitness App

A comprehensive fitness tracking application for monitoring body composition, performance metrics, and progress over time.

## Features

- **Dashboard** - At-a-glance view of key metrics with trend indicators
- **Body Composition Tracking** - Weight, circumference, and skinfold measurements
- **Body Fat Calculations** - Four scientific methods:
  - Navy Method (circumference-based)
  - Jackson-Pollock 7-site (skinfold)
  - Jackson-Pollock 3-site (skinfold)
  - Durnin-Womersley (skinfold)
- **Performance Metrics** - Track VO2max, 5k/1k times, and cardio fitness
- **Goal Setting** - Set and track progress toward fitness goals
- **Progress Charts** - Visualize trends over time with Recharts
- **Fitness Tools**:
  - GPX Race Pace Calculator
  - Race Time Calculator
  - Cooper Test Calculator
  - Data Import

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, React Compiler
- **Backend**: Convex (real-time database & serverless functions)
- **Authentication**: @convex-dev/auth with Password provider
- **UI**: shadcn/ui (new-york style), Tailwind CSS v4, Radix primitives
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Convex account (free tier available at [convex.dev](https://convex.dev))

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd my-fitness-app
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up Convex:

   ```bash
   npx convex dev
   ```

   Follow the prompts to create a new project or link an existing one.

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Start Next.js + Convex dev servers |
| `pnpm build`        | Production build                   |
| `pnpm lint`         | Run ESLint                         |
| `pnpm typecheck`    | TypeScript type checking           |
| `pnpm check`        | Run both lint and typecheck        |
| `pnpm format`       | Format code with Prettier          |
| `pnpm format:check` | Check formatting                   |

## Project Structure

```
src/
├── app/
│   ├── (auth)/         # Sign-in/sign-up pages
│   ├── (dashboard)/    # Protected routes with sidebar
│   │   ├── page.tsx           # Dashboard
│   │   ├── measurements/      # Measurement entry
│   │   ├── progress/          # Progress charts
│   │   ├── goals/             # Goal tracking
│   │   ├── settings/          # User preferences
│   │   └── tools/             # Fitness calculators
│   └── layout.tsx      # Root layout with providers
├── components/
│   ├── ui/             # shadcn components
│   ├── auth/           # Auth forms
│   ├── measurements/   # Measurement forms
│   └── goals/          # Goal components
├── lib/
│   ├── calculations/   # Body fat & fitness formulas
│   └── unitConversion.ts
└── hooks/

convex/
├── schema.ts           # Database schema
├── auth.ts             # Auth configuration
├── measurements.ts     # Measurement CRUD
├── goals.ts            # Goal CRUD
└── userProfile.ts      # User profile management
```

## Data Model

All measurements are stored in metric units (kg, cm, mm) and converted for display based on user preferences.

### Tracked Metrics

- **Core**: Weight, waist/neck/hip circumference
- **Skinfolds** (8 sites): Chest, axilla, tricep, subscapular, abdominal, suprailiac, thigh, bicep
- **Muscle circumferences**: Upper arm, lower arm, thigh, calf, chest, shoulder
- **Performance**: 5k time, 1k time, VO2max

## License

MIT
