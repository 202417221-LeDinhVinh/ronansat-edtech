"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import UserStatsPanel from "@/components/dashboard/UserStatsPanel";
import LeaderboardTable from "@/components/dashboard/LeaderboardTable";
import TestLibrary from "@/components/dashboard/TestLibrary";
import UserStatsPanelSkeleton from "@/components/dashboard/UserStatsPanelSkeleton";
import LeaderboardTableSkeleton from "@/components/dashboard/LeaderboardTableSkeleton";
import { API_PATHS } from "@/lib/apiPaths";
import api from "@/lib/axios";
import { getClientCache, setClientCache } from "@/lib/clientCache";

type CachedTestsPayload = {
  tests: any[];
  totalPages: number;
};

type CachedUserStatsPayload = {
  userStats: {
    testsTaken: number;
    highestScore: number;
  };
  userResults: any[];
};

function getTestsQueryParams(sortOption: string) {
  let sortBy = "createdAt";
  let sortOrder = "desc";

  if (sortOption === "oldest") {
    sortOrder = "asc";
  } else if (sortOption === "title_asc") {
    sortBy = "title";
    sortOrder = "asc";
  } else if (sortOption === "title_desc") {
    sortBy = "title";
    sortOrder = "desc";
  }

  return { sortBy, sortOrder };
}

function getTestsClientCacheKey(page: number, limit: number, sortOption: string) {
  const { sortBy, sortOrder } = getTestsQueryParams(sortOption);
  return `tests:${page}:${limit}:${sortBy}:${sortOrder}`;
}

const USER_STATS_CACHE_KEY = "dashboard:user-stats";
const LEADERBOARD_CACHE_KEY = "dashboard:leaderboard";

export default function FullLengthDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const limit = 6;
  const initialTestsCache = getClientCache<CachedTestsPayload>(getTestsClientCacheKey(1, limit, "newest"));
  const initialUserStatsCache = getClientCache<CachedUserStatsPayload>(USER_STATS_CACHE_KEY);
  const initialLeaderboardCache = getClientCache<any[]>(LEADERBOARD_CACHE_KEY);

  const [tests, setTests] = useState<any[]>(() => initialTestsCache?.tests ?? []);
  const [testsLoading, setTestsLoading] = useState(() => !initialTestsCache);
  const [testsRefreshing, setTestsRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(() => !initialUserStatsCache);
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(() => !initialLeaderboardCache);
  const [leaderboardRefreshing, setLeaderboardRefreshing] = useState(false);
  const [userStats, setUserStats] = useState(() => initialUserStatsCache?.userStats ?? { testsTaken: 0, highestScore: 0 });
  const [userResults, setUserResults] = useState<any[]>(() => initialUserStatsCache?.userResults ?? []);
  const [sortOption, setSortOption] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(() => initialTestsCache?.totalPages ?? 1);
  const [leaderboard, setLeaderboard] = useState<any[]>(() => initialLeaderboardCache ?? []);
  const [selectedPeriod, setSelectedPeriod] = useState("All");
  const hasCachedDashboardView = Boolean(initialTestsCache || initialUserStatsCache || initialLeaderboardCache);

  const uniquePeriods = [
    "All",
    ...Array.from(
      new Set(
        tests.map((test) => {
          const parts = test.title.split(" ");
          if (parts.length >= 2) {
            return `${parts[0]} ${parts[1]}`;
          }
          return "Other";
        })
      )
    ),
  ];

  const filteredTests = tests.filter((test) => {
    if (selectedPeriod === "All") {
      return true;
    }
    if (selectedPeriod === "Other") {
      return test.title.split(" ").length < 2;
    }
    return test.title.startsWith(selectedPeriod);
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const fetchUserStats = async () => {
      if (initialUserStatsCache) {
        setStatsRefreshing(true);
        setStatsLoading(false);
      } else {
        setStatsLoading(true);
      }

      try {
        const statsRes = await api.get(`${API_PATHS.RESULTS}?days=30`);
        const nextResults = statsRes.data.results || [];
        setUserResults(nextResults);

        const userRes = await api.get("/api/user/stats");
        if (userRes.data) {
          const nextUserStats = {
            testsTaken: userRes.data.testsTaken || 0,
            highestScore: userRes.data.highestScore || 0,
          };

          setUserStats(nextUserStats);
          setClientCache(USER_STATS_CACHE_KEY, {
            userStats: nextUserStats,
            userResults: nextResults,
          });
        }
      } catch (error) {
        console.error("Failed to load user stats", error);
      } finally {
        setStatsLoading(false);
        setStatsRefreshing(false);
      }
    };

    const fetchLeaderboard = async () => {
      if (initialLeaderboardCache) {
        setLeaderboardRefreshing(true);
        setLeaderboardLoading(false);
      } else {
        setLeaderboardLoading(true);
      }

      try {
        const res = await api.get("/api/leaderboard");
        const nextLeaderboard = res.data.leaderboard || [];
        setLeaderboard(nextLeaderboard);
        setClientCache(LEADERBOARD_CACHE_KEY, nextLeaderboard);
      } catch (error) {
        console.error("Failed to load leaderboard", error);
      } finally {
        setLeaderboardLoading(false);
        setLeaderboardRefreshing(false);
      }
    };

    fetchUserStats();
    fetchLeaderboard();
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    const fetchTests = async () => {
      const cacheKey = getTestsClientCacheKey(page, limit, sortOption);
      const cachedTests = getClientCache<CachedTestsPayload>(cacheKey);

      if (cachedTests) {
        setTests(cachedTests.tests);
        setTotalPages(cachedTests.totalPages);
        setTestsLoading(false);
        setTestsRefreshing(true);
      } else {
        setTestsLoading(true);
        setTestsRefreshing(false);
      }

      try {
        const { sortBy, sortOrder } = getTestsQueryParams(sortOption);
        const res = await api.get(`${API_PATHS.TESTS}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`);

        if (cancelled) {
          return;
        }

        const nextTests = res.data.tests || [];
        const nextTotalPages = res.data.pagination?.totalPages || 1;

        setTests(nextTests);
        setTotalPages(nextTotalPages);
        setClientCache(cacheKey, {
          tests: nextTests,
          totalPages: nextTotalPages,
        });
      } catch (error) {
        console.error("Failed to fetch tests", error);
      } finally {
        if (!cancelled) {
          setTestsLoading(false);
          setTestsRefreshing(false);
        }
      }
    };

    fetchTests();

    return () => {
      cancelled = true;
    };
  }, [limit, page, sortOption]);

  if (status === "loading" && !hasCachedDashboardView) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <UserStatsPanelSkeleton />
          <LeaderboardTableSkeleton />
          <TestLibrary
            uniquePeriods={["All", "March 2026", "May 2026"]}
            selectedPeriod="All"
            setSelectedPeriod={() => {}}
            sortOption="newest"
            setSortOption={() => {}}
            page={1}
            setPage={() => {}}
            loading={true}
            filteredTests={[]}
            totalPages={1}
          />
        </main>
      </div>
    );
  }

  if (!session && status !== "loading") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {statsLoading && userResults.length === 0 && userStats.testsTaken === 0 && userStats.highestScore === 0 ? (
          <UserStatsPanelSkeleton />
        ) : (
          <div>
            {statsRefreshing && <div className="mb-2 text-sm text-slate-500 animate-pulse">Syncing stats...</div>}
            <UserStatsPanel userStats={userStats} userResults={userResults} />
          </div>
        )}
        {leaderboardLoading && leaderboard.length === 0 ? (
          <LeaderboardTableSkeleton />
        ) : (
          <div>
            {leaderboardRefreshing && <div className="mb-2 text-sm text-slate-500 animate-pulse">Syncing leaderboard...</div>}
            <LeaderboardTable leaderboard={leaderboard} />
          </div>
        )}
        <TestLibrary
          uniquePeriods={uniquePeriods}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          sortOption={sortOption}
          setSortOption={setSortOption}
          page={page}
          setPage={setPage}
          loading={testsLoading}
          syncing={testsRefreshing}
          filteredTests={filteredTests}
          totalPages={totalPages}
        />
      </main>
    </div>
  );
}
