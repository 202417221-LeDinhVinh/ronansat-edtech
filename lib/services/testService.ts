// Trả về list đề thi với tính năng phân trang (Pagination) - lấy 1 lượng nhỏ mỗi trang tránh lấy 100% sẽ sập
// Tạo 1 đề thi mới qua bước kiểm tra Zod


import dbConnect from "@/lib/mongodb";
import Test from "@/lib/models/Test";
import { TestValidationSchema } from "@/lib/schema/test";
import { z } from "zod";

export const testService = {
    async getTests(page: number, limit: number, sortBy: string, sortOrder: string) {   // Nhận 4 yêu cầu: Muốn xem trang mấy, limit mỗi trang bao nhiêu đề, sắp xếp theo yếu tố nào, tăng hay giảm 
        await dbConnect();

        // Tham số để biết cần bắt đầu lấy từ bài test thứ mấy cho trang hiện tại
        // vd: Có 10 đề/trang, đang ở trang 1 => (1-1)*10  = 0 => Bắt đầu lấy từ bài test thứ 0
        const skip = (page - 1) * limit;

        const sortObj: any = {};             // sortObj là 1 object rỗng để chứa quy tắc sắp xếp
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;            
        // khi thêm 1 đặc tính biết rõ tên vào 1 object, ta dùng dấu .   ->  sortObj.cachSort   = 1
        // nhưng ở đây sortBy là 1 biến không cố định, nó là cách sort, ta cần truyền vào object này Cách sort VÀ Thứ tự theo cách sort đó (tăng/giảm)
        // cách thêm vào object như vậy thêm được giá trị biến sortBy chứa, k phải chữ sortBy
        // -> vd Được như này { score: 1 }

        const totalTests = await Test.countDocuments({});  // Tổng số bài test có trong kho, ({}) nghĩa là k có điều kiện lọc nào cả, đếm tất cả 
        const tests = await Test.find({}).sort(sortObj).skip(skip).limit(limit);    // Test.find({}) -> Lấy tất cả đề thi, sort() theo quy tắc mình đã cho vào sortObj (sort theo cái gì, tăng/giảm)
                                                    // skip là tính số index của Test đầu tiên thuộc trang này, limit là số bài test được lấy kể từ bài test đầu mà skip tính ra
        return { // Trả về các thông số các bài test lấy về để FE display
            tests,                  // Chứa danh sách các đề thi của trang hiện tại lấy được 
            pagination: {                 // Thông tin giúp hiển thị page
                total: totalTests,        // Tổng cộng có bao nhiêu đề thi, để hiện kiểu "Đang xem 1-10 trên tổng số 150 đề thi" 
                page,                     // user đang ở trang số mấy
                limit,                    // mỗi trang tối đa bao nhiêu đề
                totalPages: Math.ceil(totalTests / limit)            // Math.ceil là làm tròn lên, lấy tổng số test chia số test mỗi trang => Có được số trang cần vẽ
            }
        };
    },

    async createTest(data: any) {
        try {
            const validatedData = TestValidationSchema.parse(data);   // Test dữ liệu có đúng theo khuôn Zod không, có thì tạo ra data bản sạch validatedData
            await dbConnect();
            const newTest = await Test.create(validatedData);     // Tạo thêm bài test dựa vào dữ liệu bản sạch đã được check với Schema

            return newTest;
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const err: any = new Error("Validation Error");
                err.errors = (error as any).errors;
                err.name = "ZodError";
                throw err;
            }
            throw error;
        }
    }
};
