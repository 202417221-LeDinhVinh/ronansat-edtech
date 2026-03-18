// file routing giao việc cho Controller làm việc khi nhận lệnh GET stats

import { userController } from "@/lib/controllers/userController";

export async function GET(req: Request) {
    return userController.getUserStats(req);
}
