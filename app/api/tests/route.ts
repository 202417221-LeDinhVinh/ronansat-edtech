// Hàm routing giao việc cho Controller xử lý tests tùy vào là GET hay POST


import { testController } from "@/lib/controllers/testController";

export async function GET(req: Request) {
    return testController.getTests(req);
}

export async function POST(req: Request) {
    return testController.createTest(req);
}
