"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Layers,
  LayoutGrid,
  Trophy,
  XCircle,
  MinusCircle,
} from "lucide-react";

import ReviewPageSkeleton from "@/components/ReviewPageSkeleton";
import ReviewPopup from "@/components/ReviewPopup";
import { API_PATHS } from "@/lib/apiPaths";
import api from "@/lib/axios";
import { getClientCache, setClientCache } from "@/lib/clientCache";

const REVIEW_RESULTS_CACHE_KEY = "review:results";

function ReviewContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const urlMode = searchParams.get("mode");
  const urlTestId = searchParams.get("testId");
  const initialResultsCache = getClientCache<any[]>(REVIEW_RESULTS_CACHE_KEY) ?? [];

  const [results, setResults] = useState<any[]>(() => initialResultsCache);
  const [loading, setLoading] = useState(() => initialResultsCache.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [testType, setTestType] = useState<"full" | "sectional">(urlMode === "sectional" ? "sectional" : "full");
  const [activeTestId, setActiveTestId] = useState<string | null>(urlTestId || null);
  const [selectedAnswer, setSelectedAnswer] = useState<any | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/auth";
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    const fetchResults = async () => {
      if (initialResultsCache.length > 0) {
        setLoading(false);
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.get(API_PATHS.RESULTS);
        if (cancelled) {
          return;
        }

        const data = res.data.results || [];
        setResults(data);
        setClientCache(REVIEW_RESULTS_CACHE_KEY, data);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [status, initialResultsCache.length]);

  useEffect(() => {
    if (results.length === 0) {
      setActiveTestId(null);
      return;
    }

    const filteredData = results.filter((result: any) => (testType === "full" ? !result.isSectional : result.isSectional));
    const isValidActiveTest = filteredData.some((result: any) => result._id === activeTestId);

    if (!isValidActiveTest && filteredData.length > 0) {
      setActiveTestId(filteredData[0]._id);
    } else if (filteredData.length === 0) {
      setActiveTestId(null);
    }
  }, [activeTestId, results, testType]);

  const handleExpandExplanation = async (questionId: string) => {
    if (expandedExplanations[questionId]) {
      return;
    }

    setLoadingExplanations((prev) => ({ ...prev, [questionId]: true }));
    try {
      const res = await api.get(API_PATHS.getQuestionExplanation(questionId));
      if (res.data.explanation) {
        setExpandedExplanations((prev) => ({ ...prev, [questionId]: res.data.explanation }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingExplanations((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  if ((loading && results.length === 0) || (status === "loading" && results.length === 0)) {
    return <ReviewPageSkeleton />;
  }

  const filteredResults = results.filter((result) => (testType === "full" ? !result.isSectional : result.isSectional));
  const activeTest = filteredResults.find((result) => result._id === activeTestId) || filteredResults[0];

  const getStats = (answers: any[]) => {
    if (!answers?.length) {
      return { correct: 0, wrong: 0, omitted: 0 };
    }

    const omitted = answers.filter((answer) => !answer.userAnswer || answer.userAnswer === "" || answer.userAnswer === "Omitted").length;
    const correct = answers.filter((answer) => answer.isCorrect).length;
    return { correct, wrong: answers.length - correct - omitted, omitted };
  };

  const toTitleCase = (value: string) => value?.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) ?? "";

  const getSectionalIcon = (subject: string) => {
    const normalizedSubject = subject?.toLowerCase() ?? "";
    if (normalizedSubject.includes("math")) {
      return <Calculator className="w-4 h-4 text-blue-600" />;
    }
    return <BookOpen className="w-4 h-4 text-indigo-600" />;
  };

  const getSectionalColors = (subject: string) => {
    const normalizedSubject = subject?.toLowerCase() ?? "";
    if (normalizedSubject.includes("math")) {
      return {
        icon: "bg-blue-100",
        title: "text-blue-700",
        module: "text-blue-600",
        badge: "bg-blue-50 text-blue-600 border-blue-100",
        divider: "bg-blue-100",
      };
    }

    return {
      icon: "bg-indigo-100",
      title: "text-indigo-700",
      module: "text-indigo-600",
      badge: "bg-indigo-50 text-indigo-600 border-indigo-100",
      divider: "bg-indigo-100",
    };
  };

  const renderGrid = (answers: any[], startIndex: number) => {
    if (!answers || answers.length === 0) {
      return <p className="text-slate-400 italic text-sm mt-2">No data for this module.</p>;
    }

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {answers.map((answer, index) => {
          const isOmitted = !answer.userAnswer || answer.userAnswer === "" || answer.userAnswer === "Omitted";
          let className = "bg-slate-50 text-slate-500 border border-slate-200";

          if (!isOmitted) {
            className = answer.isCorrect
              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200";
          }

          return (
            <button
              key={index}
              title={`Q${startIndex + index + 1} - ${isOmitted ? "Omitted" : answer.isCorrect ? "Correct" : "Incorrect"}`}
              onClick={() => setSelectedAnswer(answer)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-150 hover:scale-110 active:scale-95 ${className}`}
            >
              {startIndex + index + 1}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-72 bg-white border-r border-slate-200 h-[calc(100vh-64px)] sticky top-16 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <LayoutGrid className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="font-bold text-base text-slate-800">Review Mistakes</h2>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setTestType("full")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                testType === "full" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Layers className="w-3 h-3" />
              FULL LENGTH
            </button>
            <button
              onClick={() => setTestType("sectional")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                testType === "sectional" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ClipboardList className="w-3 h-3" />
              SECTIONAL
            </button>
          </div>
          {refreshing && <div className="mt-3 text-xs text-slate-500 animate-pulse">Syncing review...</div>}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {filteredResults.length === 0 && (
            <p className="text-slate-400 text-xs text-center py-10 px-4">No results found for this category.</p>
          )}
          {filteredResults.map((result) => {
            const isActive = activeTest?._id === result._id;
            const scoreLabel = result.isSectional
              ? `${result.answers.filter((answer: any) => answer.isCorrect).length} / ${result.answers.length}`
              : result.score;

            return (
              <button
                key={result._id}
                onClick={() => setActiveTestId(result._id)}
                className={`cursor-pointer w-full p-3 text-left rounded-xl transition-all group flex items-start justify-between gap-2 ${
                  isActive ? "bg-blue-50 border-2 border-blue-200" : "hover:bg-slate-50 border-2 border-transparent"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                    {result.testId?.title}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs">
                    <CalendarDays className="w-3 h-3 shrink-0" />
                    {new Date(result.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {scoreLabel}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-opacity ${
                      isActive ? "text-blue-400 opacity-60" : "opacity-0 group-hover:opacity-40 text-slate-400"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {!activeTest ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center max-w-sm">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold text-slate-700">No test results found</p>
              <p className="text-sm mt-1">Complete a test to see your grid report here.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{activeTest.testId?.title}</h1>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">
                    {testType === "full" ? "Full-length SAT Report" : `Sectional - ${activeTest.sectionalSubject}`}
                  </p>
                </div>
                {testType === "full" && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 self-start">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-700">Score: {activeTest.score}</span>
                  </div>
                )}
              </div>

              {(() => {
                const stats = getStats(activeTest.answers || []);
                return (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {stats.correct} Correct
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
                      <XCircle className="w-3.5 h-3.5" /> {stats.wrong} Wrong
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                      <MinusCircle className="w-3.5 h-3.5" /> {stats.omitted} Omitted
                    </span>
                  </div>
                );
              })()}
            </div>

            {testType === "full"
              ? (() => {
                  const rwModule1 =
                    activeTest.answers?.filter(
                      (answer: any) => answer.questionId?.section === "Reading and Writing" && answer.questionId?.module === 1
                    ) || [];
                  const rwModule2 =
                    activeTest.answers?.filter(
                      (answer: any) => answer.questionId?.section === "Reading and Writing" && answer.questionId?.module === 2
                    ) || [];
                  const mathModule1 =
                    activeTest.answers?.filter((answer: any) => answer.questionId?.section === "Math" && answer.questionId?.module === 1) || [];
                  const mathModule2 =
                    activeTest.answers?.filter((answer: any) => answer.questionId?.section === "Math" && answer.questionId?.module === 2) || [];

                  return (
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-100 rounded-lg">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                          </div>
                          <h2 className="font-bold text-base text-indigo-700">Reading &amp; Writing</h2>
                        </div>

                        {[
                          { label: "Module 1", answers: rwModule1, startIndex: 0 },
                          { label: "Module 2", answers: rwModule2, startIndex: 0 },
                        ].map(({ label, answers, startIndex }) => {
                          const stats = getStats(answers);
                          return (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-indigo-600">{label}</span>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-medium border border-indigo-100">
                                    {answers.length} Questions
                                  </span>
                                  <span>
                                    {stats.correct} correct - {stats.wrong} wrong - {stats.omitted} omitted
                                  </span>
                                </div>
                              </div>
                              <div className="h-px bg-indigo-100 mb-1" />
                              {renderGrid(answers, startIndex)}
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Calculator className="w-4 h-4 text-blue-600" />
                          </div>
                          <h2 className="font-bold text-base text-blue-700">Math</h2>
                        </div>

                        {[
                          { label: "Module 1", answers: mathModule1, startIndex: 0 },
                          { label: "Module 2", answers: mathModule2, startIndex: 0 },
                        ].map(({ label, answers, startIndex }) => {
                          const stats = getStats(answers);
                          return (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-blue-600">{label}</span>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium border border-blue-100">
                                    {answers.length} Questions
                                  </span>
                                  <span>
                                    {stats.correct} correct - {stats.wrong} wrong - {stats.omitted} omitted
                                  </span>
                                </div>
                              </div>
                              <div className="h-px bg-blue-100 mb-1" />
                              {renderGrid(answers, startIndex)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              : (() => {
                  const colors = getSectionalColors(activeTest.sectionalSubject);
                  const answers = activeTest.answers || [];
                  const stats = getStats(answers);

                  return (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${colors.icon}`}>{getSectionalIcon(activeTest.sectionalSubject)}</div>
                        <h2 className={`font-bold text-base ${colors.title}`}>{toTitleCase(activeTest.sectionalSubject)}</h2>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-bold ${colors.module}`}>Module {activeTest.sectionalModule}</span>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className={`px-2 py-0.5 rounded-md font-medium border ${colors.badge}`}>
                              {answers.length} Questions
                            </span>
                            <span>
                              {stats.correct} correct - {stats.wrong} wrong - {stats.omitted} omitted
                            </span>
                          </div>
                        </div>
                        <div className={`h-px mb-1 ${colors.divider}`} />
                        {renderGrid(answers, 0)}
                      </div>
                    </div>
                  );
                })()}

            <div className="flex items-center gap-4 px-1 pb-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Colors:</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-50 border border-emerald-400 inline-block" /> Correct
              </span>
              <span className="flex items-center gap-1.5 text-xs text-red-700 font-medium">
                <span className="w-3.5 h-3.5 rounded-md bg-red-50 border border-red-400 inline-block" /> Incorrect
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-50 border border-slate-300 inline-block" /> Omitted
              </span>
            </div>
          </div>
        )}
      </main>

      {selectedAnswer && (
        <ReviewPopup
          ans={selectedAnswer}
          onClose={() => setSelectedAnswer(null)}
          expandedExplanation={expandedExplanations[selectedAnswer.questionId?._id]}
          loadingExplanation={!!loadingExplanations[selectedAnswer.questionId?._id]}
          onExpandExplanation={handleExpandExplanation}
        />
      )}
    </div>
  );
}

export default function GridReviewPage() {
  return (
    <Suspense fallback={<ReviewPageSkeleton />}>
      <ReviewContent />
    </Suspense>
  );
}
