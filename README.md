# 📸 SnapJigsaw

**Snap a selfie. Apply a retro filter. Solve the jigsaw. Collect the polaroid.**

SnapJigsaw is a 100% client-side Progressive Web App that turns your webcam into
a puzzle generator: capture a photo, bake in a vintage filter, then reassemble it
as a scrambled jigsaw puzzle. Solve three puzzles in a row without discarding to
unlock a collectible digital polaroid for your gallery wall.

No account, no backend, no photo ever leaves your device — everything is
processed and stored locally in the browser.

## ✨ Features

- **Live camera capture** with a countdown timer, front/back camera switching,
  and shutter sound/flash feedback
- **Retro filter pipeline** (vintage, noir, and more) rendered entirely on
  `<canvas>`
- **Procedural jigsaw puzzles** sliced from your photo at 3 difficulty tiers
  (3×3 / 4×4 / 5×5), with an optional **rotation mode** that also scrambles
  piece orientation
- **Streak-based progression** — solve 3 puzzles in a row to reveal a
  polaroid; discarding a puzzle keeps your streak alive without penalty
- **Digital polaroid gallery wall**, persisted locally via `localStorage`,
  with unlockable frame styles as your collection grows
- **Installable PWA** with offline support via a service worker

## 🧱 Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev server & bundling
- [Supabase](https://supabase.com/) (optional) for cross-device sync, auth, and share links
- [React Router](https://reactrouter.com/) for the public `/share/:slug` route
- [oxlint](https://oxc.rs/) for linting (with type-aware rules enabled)
- [Vitest](https://vitest.dev/) for unit tests
- [canvas-confetti](https://github.com/catdad/canvas-confetti) for win celebrations
- [lucide-react](https://lucide.dev/) for icons

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open the printed local URL in a browser that supports `getUserMedia`
(camera access requires HTTPS or localhost).

### Other scripts

| Command             | Description                                  |
| -------------------- | --------------------------------------------- |
| `npm run dev`         | Start the Vite dev server with HMR            |
| `npm run build`       | Type-check and build a production bundle      |
| `npm run preview`     | Preview the production build locally          |
| `npm run lint`        | Run oxlint (type-aware rules included)        |
| `npm run test`        | Run the unit test suite once                  |
| `npm run test:watch`  | Run tests in watch mode                       |

## ☁️ Optional: Cloud Sync & Sharing (Supabase)

By default SnapJigsaw is 100% local — no signup, nothing leaves the device.
Optionally, you can wire it up to [Supabase](https://supabase.com) to unlock:

- **Cross-device sync** of your polaroid wall (magic-link email sign-in, no password)
- **Public share links** (`/share/:slug`) for any individual polaroid

### Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor** and run the contents of
   [`supabase/schema.sql`](./supabase/schema.sql) — this creates the
   `polaroids` table, its Row Level Security policies, and the `polaroids`
   storage bucket.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (found in **Project Settings > API**):

   ```bash
   cp .env.example .env.local
   ```

4. Restart the dev server. A "Sync Wall" button will appear in the header.

If you skip this setup, the app works exactly as before (localStorage-only)
— the sync/sharing UI simply won't appear.

### How it works

- Sign-in is via magic link (Supabase Auth `signInWithOtp`) — no passwords.
- On first sign-in, any polaroids already saved locally are pushed up to
  your account automatically (one-time migration).
- Row Level Security ensures each account can only read/write its own
  polaroids — except for rows with a `share_slug` set, which become
  publicly readable (and only that one row) to power share links.
- Share links point to `/share/:slug`, a route that works for anyone,
  signed in or not.

## 🚀 Deploying to Vercel

Vercel auto-detects this as a Vite project — no extra config needed for a
local-only deployment. If you've set up Supabase sync (above), also add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables
in your Vercel project settings (Project > Settings > Environment
Variables) before deploying, since `.env.local` is never committed.

`vercel.json` in this repo adds an SPA rewrite so the `/share/:slug` route
doesn't 404 on a direct load or refresh.

## 🕹️ How to Play

1. **Choose a difficulty** (Easy 3×3, Normal 4×4, or Hard 5×5 — unlocked after
   your first 3 polaroids) and optionally enable **Rotation Mode**.
2. **Open the camera** and let the 4-second countdown snap your photo.
3. **Pick a filter** to bake into the puzzle and final polaroid.
4. **Solve the puzzle** — tap two pieces to swap them (or drag on desktop);
   in Rotation Mode, tap a selected piece again to rotate it 90°.
5. **Repeat 3 times in a row** without discarding to unlock the polaroid
   reveal, then save it to your gallery wall.

## 🗂️ Project Structure

```
src/
├── App.tsx                  # Top-level screen router & app state
├── components/
│   ├── CameraCapture.tsx    # getUserMedia camera + countdown + shutter
│   ├── FilterSelector.tsx   # Filter preview thumbnails & selection
│   ├── JigsawPuzzle.tsx     # Puzzle board, swap/rotate interactions, win detection
│   ├── PolaroidReveal.tsx   # Post-streak reveal animation & save flow
│   ├── PolaroidWall.tsx     # Persisted gallery of saved polaroids
│   ├── LoginScreen.tsx      # Magic-link sign-in UI (optional Supabase sync)
│   └── SharedPolaroidView.tsx  # Public /share/:slug view, no auth required
├── hooks/
│   ├── AuthContext.ts       # Auth context/type definitions
│   ├── AuthProvider.tsx     # Auth state provider (session, sign-in/out)
│   └── useAuth.ts           # useAuth() hook
├── lib/
│   ├── supabaseClient.ts    # Supabase client singleton
│   └── polaroidSync.ts      # Upload/fetch/delete/share-link data layer
└── utils/
    ├── puzzleHelper.ts      # Pure slicing / scrambling / solved-state logic
    ├── imageFilters.ts      # Canvas-based filter implementations
    ├── imageEnhance.ts      # Polaroid enhancement pass
    └── soundHelper.ts       # Web Audio synthesized sound effects

supabase/
└── schema.sql               # Run once in the Supabase SQL editor
```

## 🔒 Privacy

SnapJigsaw never uploads your photos anywhere by default. Captured images,
filters, and your polaroid gallery are processed and stored entirely in your
browser (`localStorage`), and the camera stream is released as soon as you
navigate away from the capture screen.

If you opt in to cloud sync (see above), only your saved polaroids are
uploaded — to your own Supabase project, under your account — never
anything else, and never automatically without you setting it up first.

## 🧪 Testing & CI

Unit tests cover the core puzzle logic (`src/utils/puzzleHelper.ts`) —
scrambling never produces an already-solved board, no pieces are lost or
duplicated during a shuffle, and the shuffle doesn't mutate its input. A
GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, tests, and a
type-checked production build on every push and pull request.

## 🛠️ Linting

Linting is handled by [oxlint](https://oxc.rs/) with type-aware rules enabled
(see `.oxlintrc.json`), catching issues like unhandled promises, `any` usage,
and incorrect React hook dependencies at lint time rather than at runtime.

## 👨‍💻 Developer Built by **Shrish Sharan** — 2026
