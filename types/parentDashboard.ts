export type ParentDashboardOverview = {
  highestScore: number;
  testsCompleted: number;
  activityLast30Days: number;
  lastActiveAt: string | null;
};

export type ScoreHistoryPoint = {
  id: string;
  dateKey: string;
  label: string;
  total: number;
  math: number;
  rw: number;
  takenAt: string;
};

export type TestsPerDayPoint = {
  dateKey: string;
  label: string;
  tests: number;
};

export type TimeSpentPerDayPoint = {
  dateKey: string;
  label: string;
  minutes: number;
};

export type RecentTestItem = {
  id: string;
  testName: string;
  takenAt: string;
  dateLabel: string;
  timeLabel: string;
  readingWritingScore: number;
  mathScore: number;
  totalScore: number;
};

export type ParentDashboardData = {
  hasChildren: boolean;
  child: {
    id: string;
    name: string;
    email: string;
  } | null;
  overview: ParentDashboardOverview;
  timeSpentByWindow: Record<string, number>;
  scoreHistory: ScoreHistoryPoint[];
  testsPerDay: Record<string, TestsPerDayPoint[]>;
  timeSpentPerDay: Record<string, TimeSpentPerDayPoint[]>;
  recentTests: RecentTestItem[];
};
