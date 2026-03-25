    // Hàm routing giao việc cho Controller xử lý results tùy vào là GET hay POST


    import { resultController } from "@/lib/controllers/resultController";

    export async function POST(req: Request) {
        return resultController.createResult(req);
    }

    export async function GET(req: Request) {
        return resultController.getUserResults(req);
    }
