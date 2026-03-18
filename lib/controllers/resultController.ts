// Kiểm tra Login
// Tiếp nhận yêu cầu lưu điểm mới hoặc xem lịch sử điểm rồi giao cho Service


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { resultService } from "@/lib/services/resultService";

export const resultController = {

    async createResult(req: Request) {  // Tạo thêm 1 Result
        try {
            const session = await getServerSession(authOptions);
            if (!session) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });  // Check login
            }
 
            const body = await req.json();     // Lấy data của result dạng JSON
            const newResult = await resultService.createResult(session.user.id, body);     //  Giao id user và thông tin kết quả cho hàm Service 

            return NextResponse.json({ result: newResult }, { status: 201 });
        } catch (error: any) {
            console.error("Error creating result:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    },

    async getUserResults(req: Request) {    // Lấy list kết quả 
        try {
            const session = await getServerSession(authOptions);
            if (!session) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }   // Ktra login

            const url = new URL(req.url);        // dịch và mổ xẻ link url user đang truy cập vào  
            const daysQuery = url.searchParams.get("days");                 // tìm xem trong url có tham số ngày thể hiện lấy kết quả trong bao nhiêu ngày gần nhất k , nếu có thì url sẽ có dạng api/results?days=7
            const days = daysQuery ? parseInt(daysQuery) : undefined;       // nếu url có yêu cầu số ngày thì ép nó thành dạng Int (số) thay vì string như url, k có tức là lấy toàn bộ điểm từ lúc lập nick tới giờ (undefined)

            const data = await resultService.getUserResults(session.user.id, days);        // giao việc cho service và truyền vào số ngày + id user cần tra cứu Result 
            return NextResponse.json(data);
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }
};
