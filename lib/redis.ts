// lib/redis.ts
import Redis from "ioredis";

// Điền đường link cấu hình Redis của bạn vào file .env (ví dụ REDIS_URL)
// Hoặc dùng link mặc định nếu bạn chạy Redis trên máy tính cá nhân
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redisUrl);

export default redis;