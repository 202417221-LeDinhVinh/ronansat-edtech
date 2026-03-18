// Gồm 2 hàm getChat <lấy lịch sử chat> và postMessage <gửi tin nhắn cho AI>

import { NextResponse } from "next/server";          // Công cụ đóng gói dữ liệu báo lỗi và gửi cho FE để display
import { getServerSession } from "next-auth";        // lấy session đăng nhập -> Để kiểm tra ai đang gọi API này và họ đã login chưa, công cụ lấy Session của BE để bảo mật
import { authOptions } from "@/lib/authOptions";             // bộ quy tắc cấu hình đăng nhập để getServerSession có thể sử dụng để lấy thông tin đăng nhập của user
// const session = await getServerSession(authOptions);  -> Phải có bộ quy tắc thì getServerSession mới tạo ra session chứa các thông tin đăng nhập được
import { chatService } from "@/lib/services/chatService";   // Nhân viên làm việc nặng nhọc (kết nối DB, gọi AI), file này chỉ giao việc



export const chatController = {
    async getChat(req: Request) {     // Truyền vào 1 request
        try {
            const session = await getServerSession(authOptions);          // Lấy thông tin session đăng nhập của user
            if (!session) {      // K lấy được session => Chưa login 
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }


            // req.url là 1 string like https://trangweb.com/api/chat?questionId=123&user=admin 
            // new URL(req.url); => Tách từng phần trong url đó là từng phần riêng: vd: hostname: trangweb.com,  pathname: /api/chat , searchParams: questionId=123&user=admin
            const { searchParams } = new URL(req.url);      // destructuring lấy đúng cái searchParams ra 
            const questionId = searchParams.get('questionId');    // Lấy giá trị của questionId ( 123 ) và gán vào biến questionId
  
            if (!questionId) {    // K lấy được id câu hỏi thì báo lỗi
                return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
            }

            const messages = await chatService.getChatHistory(session.user.id, questionId);  // Lấy được thì gọi nhân viên xử lý việc lấy chat, truyền vào id của người dùng và id câu hỏi để đi lấy lịch sử chat

            return NextResponse.json({ messages });   // Đóng gói các tin nhắn vừa lấy được và gửi ở dạng JSON

        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    },

    async postMessage(req: Request) {     // Gửi tin nhắn
        try {
            const session = await getServerSession(authOptions);      // Lấy session k, có là chưa login, tương tự trên
            if (!session) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }


            const { questionId, message } = await req.json();    // Destructure lấy id của câu user đang chat và nội dung đoạn chat đó
            if (!questionId || !message) {      // K có 1 trong 2 là lỗi luôn
                return NextResponse.json({ error: "Missing questionId or message" }, { status: 400 });
            }

            //  giao việc cho nhân viên, truyền vào id user, id câu hỏi, nội dung câu hỏi
            const result = await chatService.processMessage(session.user.id, questionId, message);

            return NextResponse.json(result);

        } catch (error: any) {  // Có lỗi khi gửi cho AI 
            console.error("Chat API Error:", error);
            if (error.message === "Gemini API key not configured") {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }
};
