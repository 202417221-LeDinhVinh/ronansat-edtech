// Bàn tiếp tân liên quan tới chat -> Nhận yêu cầu GET or POST và đẩy cho chatController giải quyết (routing)

import { chatController } from "@/lib/controllers/chatController";

// nói chung là giao việc cho GET or POST
// quy định khi routing: Tên làm phải là phương thức, không được tự đặt
export async function POST(req: Request) {      // req là POST thì hàm này chạy
    return chatController.postMessage(req);
}

export async function GET(req: Request) {
    return chatController.getChat(req);
}
