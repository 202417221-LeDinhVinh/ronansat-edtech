import dbConnect from "@/lib/mongodb";
import Result from "@/lib/models/Result";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 3600;
const HALL_OF_FAME_CACHE_KEY = "hall_of_fame";

export const leaderboardService = {
  async getLeaderboard() {
    const cachedHallOfFame = await redis.get(HALL_OF_FAME_CACHE_KEY);

    if (cachedHallOfFame) {
      return JSON.parse(cachedHallOfFame);
    }

    await dbConnect();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const hallOfFame = await Result.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          score: { $gt: 1450 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $group: {
          _id: "$userId",
          name: { $first: "$userInfo.name" },
          testsCompleted: { $sum: 1 },
          highestScore: { $max: "$score" },
        },
      },
      {
        $sort: { testsCompleted: -1, highestScore: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    await redis.set(HALL_OF_FAME_CACHE_KEY, JSON.stringify(hallOfFame), "EX", CACHE_TTL_SECONDS);

    return hallOfFame;
  },
};
