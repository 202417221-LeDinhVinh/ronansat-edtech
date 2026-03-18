// [id] -> Đường dẫn động, url mà là /api/questions/123/explanation thì 123 sẽ được nhét vào biến params
//

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/lib/models/Question";   // Khuôn 1 câu hỏi
import { getServerSession } from "next-auth";   // Lấy thông tin từ phiên đăng nhập của user: vd: tên, email, trạng thái đã login or not
import { authOptions } from "@/lib/authOptions";    // Quy tắc auth của trang web


// Hàm lấy param từ url, mất thời gian -> Promise
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {   
    try {
        const { id } = await params; // Lấy param (đang là 1 Promise) cho vào id
        
        // Muốn xem lời giải phải đăng nhập -> Check đã login chưa
        const session = await getServerSession(authOptions);   // Lấy thông tin session đăng nhập theo quy tắc auth của trang web (authOptions)
        if (!session) { // Chưa đăng nhập => Không có session login => Unauthorized
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const question = await Question.findById(id).select("explanation");  // .select() vì 1 câu hỏi chứa rất nhiều data, mình chỉ lấy "explanation" thôi
                                                                             // Hàm này tìm question theo id và trong question tìm được chỉ chứa explanation
        if (!question) {    // Không tìm thấy câu hỏi có id đó => Lỗi
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        return NextResponse.json({ explanation: question.explanation });  // Có thì return phần explanation của question đó
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
