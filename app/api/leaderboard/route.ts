import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Result from "@/lib/models/Result"; // Bảng chứa kết quả làm bài

export async function GET() {
    try {
        await dbConnect();

        // 1. Tính mốc thời gian: 7 ngày trước so với hiện tại
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 2. Dùng Aggregation (Bộ gộp dữ liệu siêu mạnh của MongoDB) để tính toán
        const leaderboard = await Result.aggregate([
            // Bước A: Chỉ lọc những bài test nộp trong 7 ngày qua VÀ có điểm > 1450
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                    score: { $gt: 1450 }
                }
            },
            // Bước B: Nối sang bảng users để lấy tên của học sinh (dựa vào userId)
            {
                $lookup: {
                    from: "users", // Tên bảng user trong Database mặc định là chữ thường, thêm 's'
                    localField: "userId",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            // Gỡ mảng thông tin user ra để dễ lấy tên
            { $unwind: "$userInfo" }, 
            
            // Bước C: Gom nhóm tất cả kết quả theo từng học sinh
            {
                $group: {
                    _id: "$userId", // Gom theo ID học sinh
                    name: { $first: "$userInfo.name" }, // Lấy tên của học sinh đó
                    testsCompleted: { $sum: 1 },        // Cứ có 1 bài thỏa mãn thì cộng 1
                    highestScore: { $max: "$score" }    // Tìm ra điểm lớn nhất trong các bài thỏa mãn
                }
            },
            // Bước D: Sắp xếp theo số bài test giảm dần (-1). Nếu số bài bằng nhau thì ai điểm cao hơn xếp trên.
            {
                $sort: { testsCompleted: -1, highestScore: -1 }
            },
            // Bước E: Cắt lấy đúng 10 người đứng đầu
            {
                $limit: 10
            }
        ]);

        return NextResponse.json({ leaderboard });
    } catch (error) {
        console.error("Leaderboard error:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}