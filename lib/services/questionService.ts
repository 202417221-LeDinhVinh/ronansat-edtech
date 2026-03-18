// Lấy danh sách câu hỏi từ DB
// Tạo câu hỏi mới


import dbConnect from "@/lib/mongodb";
import Question from "@/lib/models/Question";
import Test from "@/lib/models/Test";
import { QuestionValidationSchema } from "@/lib/schema/question";   // schema kiểm tra data có thiếu gì k ngay từ API
import { z } from "zod";                                            // thư viện kiểm tra format dữ liệu nghiêm ngặt

export const questionService = {
    async getQuestions(testId?: string | null) {    // truyền vào testId, ? là optional, k có testId thì lấy 100% các câu hỏi (cho admin)
                       // nếu gọi getQuestion() thì testId sẽ = undefined, JSON không thể hiện được undefined => cần backup là null để dễ xử lý
        await dbConnect();
        let query = {};        // Tạo bộ lọc tìm kiểm ban đầu rỗng
        if (testId) {                 
            query = { testId };    // Nếu user có gửi testId thì tìm các câu có testId này thôi
        }   // hàm find() trả về tất cả các giá trị thỏa mãn, truyền vào phải là 1 object chứ k được chỉ là testId => Cần tạo query là 1 object
        // không dùng findById(testId) được vì findById chỉ tìm trong cột _id của câu đó chứ k trong testId và nó chỉ trả về 1 kết quả duy nhất

        const questions = await Question.find(query);    // lọc các câu thuộc testId đó
        return questions;
    },

    async createQuestion(data: any) {
        try {
            const validatedData = QuestionValidationSchema.parse(data);   // parse chuyển đổi data thành JSON và dùng schema kiểm tra format, lỗi/thiếu thì quăng ngay error và đoạn dưới k được chạy nữa
                                                        // data là thông tin câu hỏi cần thêm
            await dbConnect();

            // Tìm bài test muốn thêm câu hỏi
            const test = await Test.findById(validatedData.testId);
            if (!test) {
                throw new Error("Test not found");
            }

            // Dùng model Question tạo câu hỏi mới và thêm thẳng vào DB, câu đó sẽ được auto thêm 1 _id
            const newQuestion = await Question.create(validatedData);   // Đây mới là lưu vào DB


            // Khi tạo Question, trong DB đã có data về việc nó thuộc bài nào ( testId ) nhưng bài test đó chưa biết được nó vừa thêm 1 câu mới 
            if (!test.questions) {         // Nếu trước đây bài test này chưa có câu nào thì tạo 1 mảng rỗng để push câu vào
                test.questions = [];
            }
            test.questions.push(newQuestion._id as any);    // push id của câu vừa tạp vào array questions của bài test
            await test.save();        // Lưu kết quả

            return newQuestion;
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
