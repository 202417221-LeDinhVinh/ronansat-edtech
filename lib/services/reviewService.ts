import { readThroughClientCache } from "@/lib/clientCache";
import { API_PATHS } from "@/lib/apiPaths";
import api from "@/lib/axios";
import type { ReviewResult } from "@/types/review";

interface FetchOptions {
  forceRefresh?: boolean;
}

export async function fetchReviewResults(options?: FetchOptions) {
  return readThroughClientCache(
    "api:review:results",
    async () => {
      const res = await api.get(`${API_PATHS.RESULTS}?view=detail`);
      return (res.data.results || []) as ReviewResult[];
    },
    options,
  );
}

export async function fetchQuestionExplanation(questionId: string) {
  const res = await api.get(API_PATHS.getQuestionExplanation(questionId));
  return (res.data.explanation || "") as string;
}
