// Hàm routing giao việc cho Controller xử lý question tùy vào là GET hay POST

import { questionController } from "@/lib/controllers/questionController";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
    return questionController.getQuestions(req);
}

export async function POST(req: Request) {
    return questionController.createQuestion(req);
}
