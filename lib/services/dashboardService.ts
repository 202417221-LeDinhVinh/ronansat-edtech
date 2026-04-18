import { readThroughClientCache } from "@/lib/clientCache";
import { API_PATHS } from "@/lib/apiPaths";
import api from "@/lib/axios";
import type { LeaderboardEntry, UserResultSummary, UserStatsSummary } from "@/types/testLibrary";

interface FetchOptions {
  forceRefresh?: boolean;
  view?: ResultsView;
}

type ResultsView = "summary" | "detail";

export async function fetchDashboardUserResults(
  days?: number,
  options?: FetchOptions,
): Promise<UserResultSummary[]> {
  const view = options?.view ?? "summary";
  const searchParams = new URLSearchParams();
  if (typeof days === "number") {
    searchParams.set("days", String(days));
  }
  if (view === "summary") {
    searchParams.set("view", view);
  }

  const query = searchParams.toString();
  const cacheKey = `api:dashboard:results:${view}:${days ?? "all"}`;

  return readThroughClientCache(
    cacheKey,
    async () => {
      const res = await api.get(query ? `${API_PATHS.RESULTS}?${query}` : API_PATHS.RESULTS);
      return (res.data.results || []) as UserResultSummary[];
    },
    options,
  );
}

export async function fetchDashboardUserStats(options?: FetchOptions): Promise<UserStatsSummary> {
  return readThroughClientCache(
    "api:dashboard:stats",
    async () => {
      const res = await api.get("/api/user/stats");
      return {
        testsTaken: (res.data.testsTaken || 0) as number,
        highestScore: (res.data.highestScore || 0) as number,
      } satisfies UserStatsSummary;
    },
    options,
  );
}

export async function fetchLeaderboard(options?: FetchOptions): Promise<LeaderboardEntry[]> {
  return readThroughClientCache(
    "api:dashboard:leaderboard",
    async () => {
      const res = await api.get("/api/leaderboard");
      return (res.data.leaderboard || []) as LeaderboardEntry[];
    },
    options,
  );
}
