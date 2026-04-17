import mongoose from "mongoose";

import dbConnect from "@/lib/mongodb";
import Result from "@/lib/models/Result";
import Test from "@/lib/models/Test";
import User from "@/lib/models/User";
import type {
  ParentDashboardData,
  RecentTestItem,
  TestsPerDayPoint,
  TimeSpentPerDayPoint,
} from "@/types/parentDashboard";

type SessionUser = {
  id?: string;
  role?: string;
};

type ParentLean = {
  childrenIds?: mongoose.Types.ObjectId[];
};

type ChildLean = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email: string;
  highestScore?: number;
};

type ResultLean = {
  _id: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  totalScore?: number;
  readingScore?: number;
  mathScore?: number;
  score?: number;
  date?: Date;
  createdAt?: Date;
};

type TestLean = {
  _id: mongoose.Types.ObjectId;
  title?: string;
  timeLimit?: number;
};

type NormalizedResult = {
  id: string;
  takenAt: Date;
  testName: string;
  timeSpentMinutes: number;
  totalScore: number;
  readingWritingScore: number;
  mathScore: number;
};

const ACTIVITY_WINDOWS = [1, 7, 15, 30] as const;
const DAILY_TREND_WINDOWS = [7, 15, 30] as const;
const TIME_TREND_WINDOWS = [1, 7, 15, 30] as const;

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatDateKey(date: Date) {
  return startOfDay(date).toISOString().split("T")[0];
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function buildDailyCountSeries(dates: Date[], window: number): TestsPerDayPoint[] {
  const today = startOfDay(new Date());
  const start = startOfDay(new Date(today));
  start.setDate(today.getDate() - (window - 1));

  const countMap = new Map<string, number>();

  dates.forEach((date) => {
    const normalized = startOfDay(date);
    if (normalized < start || normalized > today) {
      return;
    }

    const key = formatDateKey(normalized);
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  });

  return Array.from({ length: window }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const dateKey = formatDateKey(current);

    return {
      dateKey,
      label: formatShortDate(current),
      tests: countMap.get(dateKey) ?? 0,
    };
  });
}

function buildDailyMinutesSeries(
  entries: Array<{ date: Date; minutes: number }>,
  window: number,
): TimeSpentPerDayPoint[] {
  const today = startOfDay(new Date());
  const start = startOfDay(new Date(today));
  start.setDate(today.getDate() - (window - 1));

  const minutesMap = new Map<string, number>();

  entries.forEach((entry) => {
    const normalized = startOfDay(entry.date);
    if (normalized < start || normalized > today) {
      return;
    }

    const key = formatDateKey(normalized);
    minutesMap.set(key, (minutesMap.get(key) ?? 0) + entry.minutes);
  });

  return Array.from({ length: window }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const dateKey = formatDateKey(current);

    return {
      dateKey,
      label: formatShortDate(current),
      minutes: minutesMap.get(dateKey) ?? 0,
    };
  });
}

function buildEmptyParentDashboard(): ParentDashboardData {
  return {
    hasChildren: false,
    child: null,
    overview: {
      highestScore: 0,
      testsCompleted: 0,
      activityLast30Days: 0,
      lastActiveAt: null,
    },
    timeSpentByWindow: {},
    scoreHistory: [],
    testsPerDay: {},
    timeSpentPerDay: {},
    recentTests: [],
  };
}

function normalizeResults(rawResults: ResultLean[], tests: TestLean[]): NormalizedResult[] {
  const testMap = new Map(tests.map((test) => [test._id.toString(), test]));

  return rawResults.map((result) => {
    const takenAt = new Date(result.createdAt ?? result.date ?? new Date());
    const test = testMap.get(result.testId.toString());

    return {
      id: result._id.toString(),
      takenAt,
      testName: test?.title ?? "Practice Test",
      timeSpentMinutes: test?.timeLimit ?? 0,
      totalScore: result.totalScore ?? result.score ?? 0,
      readingWritingScore: result.readingScore ?? 0,
      mathScore: result.mathScore ?? 0,
    };
  });
}

function buildRecentTests(results: NormalizedResult[]): RecentTestItem[] {
  return results
    .slice()
    .reverse()
    .map((result) => ({
      id: result.id,
      testName: result.testName,
      takenAt: result.takenAt.toISOString(),
      dateLabel: result.takenAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      timeLabel: result.takenAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      readingWritingScore: result.readingWritingScore,
      mathScore: result.mathScore,
      totalScore: result.totalScore,
    }));
}

export async function getParentDashboardData(sessionUser: SessionUser): Promise<ParentDashboardData> {
  if (!sessionUser.id) {
    throw new Error("Forbidden");
  }

  await dbConnect();

  let targetUserId: mongoose.Types.ObjectId | string | undefined = sessionUser.id;

  if (sessionUser.role === "PARENT") {
    const parent = await User.findById(sessionUser.id).select("childrenIds").lean<ParentLean | null>();

    if (!parent) {
      throw new Error("Parent not found");
    }

    targetUserId = parent.childrenIds?.[0];

    if (!targetUserId) {
      return buildEmptyParentDashboard();
    }
  }

  const [child, rawResults] = await Promise.all([
    User.findById(targetUserId).select("name email highestScore").lean<ChildLean | null>(),
    Result.find({ userId: targetUserId, isSectional: { $ne: true } })
      .sort({ createdAt: 1 })
      .select("testId totalScore readingScore mathScore score date createdAt")
      .lean<ResultLean[]>(),
  ]);

  if (!child) {
    return buildEmptyParentDashboard();
  }

  const testIds = Array.from(new Set(rawResults.map((result) => result.testId?.toString()).filter(Boolean)));
  const tests =
    testIds.length > 0
      ? await Test.find({ _id: { $in: testIds } }).select("title timeLimit").lean<TestLean[]>()
      : [];

  const normalizedResults = normalizeResults(rawResults, tests);
  const recentTests = buildRecentTests(normalizedResults);

  const today = startOfDay(new Date());
  const activityLast30Start = startOfDay(new Date(today));
  activityLast30Start.setDate(today.getDate() - 29);

  const timeSpentByWindow = Object.fromEntries(
    ACTIVITY_WINDOWS.map((window) => {
      const rangeStart = startOfDay(new Date(today));
      rangeStart.setDate(today.getDate() - (window - 1));

      const total = normalizedResults.reduce((sum, result) => {
        if (result.takenAt >= rangeStart && result.takenAt <= endOfDay(today)) {
          return sum + result.timeSpentMinutes;
        }
        return sum;
      }, 0);

      return [String(window), total];
    }),
  );

  const testsPerDay = Object.fromEntries(
    DAILY_TREND_WINDOWS.map((window) => [
      String(window),
      buildDailyCountSeries(
        normalizedResults.map((result) => result.takenAt),
        window,
      ),
    ]),
  );

  const timeSpentPerDay = Object.fromEntries(
    TIME_TREND_WINDOWS.map((window) => [
      String(window),
      buildDailyMinutesSeries(
        normalizedResults.map((result) => ({
          date: result.takenAt,
          minutes: result.timeSpentMinutes,
        })),
        window,
      ),
    ]),
  );

  const lastActiveAt =
    normalizedResults.length > 0 ? normalizedResults[normalizedResults.length - 1].takenAt.toISOString() : null;

  return {
    hasChildren: true,
    child: {
      id: child._id.toString(),
      name: child.name ?? "Student",
      email: child.email,
    },
    overview: {
      highestScore: Math.max(child.highestScore ?? 0, ...normalizedResults.map((result) => result.totalScore), 0),
      testsCompleted: normalizedResults.length,
      activityLast30Days: normalizedResults.filter((result) => result.takenAt >= activityLast30Start).length,
      lastActiveAt,
    },
    timeSpentByWindow,
    scoreHistory: normalizedResults.map((result) => ({
      id: result.id,
      dateKey: formatDateKey(result.takenAt),
      label: formatShortDate(result.takenAt),
      total: result.totalScore,
      math: result.mathScore,
      rw: result.readingWritingScore,
      takenAt: result.takenAt.toISOString(),
    })),
    testsPerDay,
    timeSpentPerDay,
    recentTests,
  };
}
