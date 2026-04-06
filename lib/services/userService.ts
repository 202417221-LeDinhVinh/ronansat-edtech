import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 3600;

function getUserProfileCacheKey(userId: string) {
  return `user:profile:${userId}`;
}

function getUserStatsCacheKey(userId: string) {
  return `user:stats:${userId}`;
}

export const userService = {
  async getUserProfile(userId: string) {
    const cacheKey = getUserProfileCacheKey(userId);
    const cachedProfile = await redis.get(cacheKey);

    if (cachedProfile) {
      return JSON.parse(cachedProfile);
    }

    await dbConnect();

    const user = await User.findById(userId)
      .select("name email role highestScore lastTestDate createdAt updatedAt")
      .lean();

    if (!user) {
      throw new Error("User not found");
    }

    await redis.set(cacheKey, JSON.stringify(user), "EX", CACHE_TTL_SECONDS);

    return user;
  },

  async getUserStats(userId: string) {
    const cacheKey = getUserStatsCacheKey(userId);
    const cachedStats = await redis.get(cacheKey);

    if (cachedStats) {
      return JSON.parse(cachedStats);
    }

    await dbConnect();

    const user = await User.findById(userId).select("testsTaken highestScore").lean();
    if (!user) {
      throw new Error("User not found");
    }

    const stats = {
      testsTaken: user.testsTaken.length,
      highestScore: user.highestScore,
    };

    await redis.set(cacheKey, JSON.stringify(stats), "EX", CACHE_TTL_SECONDS);

    return stats;
  },
};
