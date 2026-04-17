# 2026-04-17 Performance Optimization Decisions

## What changed

- Protected route entrypoints now prefer server gating and server-prepared initial props for `dashboard`, `full-length`, `sectional`, `review`, `settings`, `admin`, and `parent/dashboard`.
- The root auth boundary now receives a server-fetched session in `app/layout.tsx` through `components/AuthProvider.tsx` instead of forcing the first protected render to wait for a client-only session round trip.
- `VocabBoardProvider` is now mounted only under `app/vocab/layout.tsx`; `FixBoardProvider` remains scoped to `/fix`.
- Client request reuse now flows through `readThroughClientCache()` in `lib/clientCache.ts`, which dedupes both resolved cache hits and in-flight requests.
- Result fetching is now split by view:
  - `summary` for dashboard and library-style consumers
  - `detail` for review
- Parent dashboard assembly now lives in `lib/services/parentDashboardService.ts`, and the API route is a thin wrapper over that shared service.
- Published question reads now use a cacheable GET path plus a client question fetcher in `lib/services/questionClientService.ts`.
- Admin creation flows now invalidate browser-side `tests:` and `api:questions:` cache keys after successful test/question mutations.

## Important boundaries

- `lib/services/resultService.ts` is now the normalization boundary for results returned to the UI. Mongo ids and dates are serialized there before hitting page props.
- `lib/services/leaderboardService.ts` now normalizes leaderboard entries to plain serializable values and keeps a short server memory cache.
- `hooks/useChatbot.ts` now reuses cached question history instead of always refetching when the panel remounts.

## Follow-up guidance

- If more protected routes still feel slow, continue the same pattern: server gate first, then hand only the interactive surface to a client component.
- If review/detail payloads grow again, keep `summary` and `detail` separate instead of widening `summary` for convenience.
- If admin mutations expand, continue invalidating both server caches and the matching browser cache prefixes in the same change.
