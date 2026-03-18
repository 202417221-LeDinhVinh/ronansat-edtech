

import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export const userService = {
    async getUserStats(userId: string) {   // Tìm highest score của 1 user bằng id
        await dbConnect();

        const user = await User.findById(userId).select("testsTaken highestScore");   // lấy kết quả highestscore 
        if (!user) {
            throw new Error("User not found");
        }

        return {
            testsTaken: user.testsTaken.length,        // trả về thông tin của user bao gồm số bài test đã làm + highest score
            highestScore: user.highestScore
        };
    }
};
