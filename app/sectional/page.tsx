"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

import Loading from "@/components/Loading";
import TestCard from "@/components/TestCard";
import TestCardSkeleton from "@/components/TestCardSkeleton";
import { API_PATHS } from "@/lib/apiPaths";
import api from "@/lib/axios";
import { getClientCache, setClientCache } from "@/lib/clientCache";

type CachedTestsPayload = {
  tests: any[];
  totalPages: number;
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

export default function SectionalTestsPage() {
  const { data: session, status } = useSession();
  const limit = 6;
  const initialTestsCache = getClientCache<CachedTestsPayload>(getTestsClientCacheKey(1, limit, "newest"));

  const [tests, setTests] = useState<any[]>(() => initialTestsCache?.tests ?? []);
  const [loading, setLoading] = useState(() => !initialTestsCache);
  const [testsRefreshing, setTestsRefreshing] = useState(false);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(() => initialTestsCache?.totalPages ?? 1);
  const [selectedPeriod, setSelectedPeriod] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("reading");
  const hasCachedSectionalView = Boolean(initialTestsCache);

  useEffect(() => {
    setSelectedPeriod("All");
    setPage(1);
  }, [subjectFilter]);

  const testsWithSubject = tests.filter((test: any) => {
    if (!test.sections || !Array.isArray(test.sections)) {
      return false;
    }

    const targetSectionName = subjectFilter === "reading" ? "Reading and Writing" : "Math";
    const section = test.sections.find((item: any) => item.name === targetSectionName);
    if (!section) {
      return false;
    }

    if (test.questionCounts) {
      if (subjectFilter === "reading") {
        return test.questionCounts.rw_1 > 0 || test.questionCounts.rw_2 > 0;
      }
      return test.questionCounts.math_1 > 0 || test.questionCounts.math_2 > 0;
    }

    return (section.questionsCount ?? 0) > 0;
  });

  const uniquePeriods = [
    "All",
    ...Array.from(
      new Set(
        testsWithSubject.map((test: any) => {
          const parts = test.title.split(" ");
          if (parts.length >= 2) {
            return `${parts[0]} ${parts[1]}`;
          }
          return "Other";
        })
      )
    ),
  ];

  const filteredTests = testsWithSubject.filter((test: any) => {
    if (selectedPeriod === "All") {
      return true;
    }
    if (selectedPeriod === "Other") {
      return test.title.split(" ").length < 2;
    }
    return test.title.startsWith(selectedPeriod);
  });

  useEffect(() => {
    if (!session) {
      return;
    }

    const fetchUserResults = async () => {
      try {
        const statsRes = await api.get(`${API_PATHS.RESULTS}?days=365`);
        if (statsRes.data.results) {
          setUserResults(statsRes.data.results);
        }
      } catch (error) {
        console.error("Failed to load results", error);
      }
    };

    fetchUserResults();
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    const fetchTests = async () => {
      const cacheKey = getTestsClientCacheKey(page, limit, sortOption);
      const cachedTests = getClientCache<CachedTestsPayload>(cacheKey);

      if (cachedTests) {
        setTests(cachedTests.tests);
        setTotalPages(cachedTests.totalPages);
        setLoading(false);
        setTestsRefreshing(true);
      } else {
        setLoading(true);
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
          setLoading(false);
          setTestsRefreshing(false);
        }
      }
    };

    fetchTests();

    return () => {
      cancelled = true;
    };
  }, [limit, page, sortOption]);

  if (status === "loading" && !hasCachedSectionalView) {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return <div className="p-8 text-center">Vui long dang nhap de xem trang nay.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Sectional Practice</h1>
          <p className="text-slate-600 mt-2">Target specific subjects and modules to improve your weak points.</p>
        </div>

        <section>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/4 flex-shrink-0">
              <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-24">
                <h2 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">Filter by Date</h2>
                <div className="flex flex-col gap-2">
                  {uniquePeriods.map((period, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedPeriod(period);
                        setPage(1);
                      }}
                      className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selectedPeriod === period
                          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      {period === "All" ? "All Tests" : period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full md:w-3/4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-transparent">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">Test Library</h2>
                  {testsRefreshing && <span className="text-sm text-slate-500 animate-pulse">Syncing...</span>}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Subject:</label>
                    <select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                    >
                      <option value="reading">Reading & Writing</option>
                      <option value="math">Math</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Sort by:</label>
                    <select
                      value={sortOption}
                      onChange={(e) => {
                        setSortOption(e.target.value);
                        setPage(1);
                      }}
                      className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="title_asc">Title (A-Z)</option>
                      <option value="title_desc">Title (Z-A)</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <TestCardSkeleton key={index} isSectional={true} />
                  ))}
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">No tests found</h3>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTests.map((test: any) => (
                      <TestCard
                        key={test._id}
                        test={test}
                        isSectional={true}
                        subjectFilter={subjectFilter}
                        userResults={userResults}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-8 gap-4">
                      <button
                        onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm font-medium text-slate-600">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
