import { NextResponse } from "next/server";

import { leaderboardService } from "@/lib/services/leaderboardService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leaderboard = await leaderboardService.getLeaderboard();
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
