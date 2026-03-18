import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage {   // Cấu trúc 1 tin nhắn
    role: "user" | "model";       // role AI hay user gửi
    parts: { text: string }[];    // nội dung tin nhắn
    timestamp: Date;              // tgian gửi tin nhắn
}

export interface IChat extends Document {         // Khung 1 đoạn chat
    userId: mongoose.Types.ObjectId;              // id user để bt ai đang chat 
    questionId: mongoose.Types.ObjectId;          // id của câu hỏi đang chat về
    messages: IMessage[];                         // mảng chứa các tin nhắn qua lại theo nguyên tắc ở trên
    updatedAt: Date;                              // thời gian đoạn chat được tạo ra và tgian có thêm 1 tin nhắn mới
    createdAt: Date;
}

// Vì sao các components cũng có Interface mà k có Schema? -> vì các components chỉ hiển thị lên UI chứ k có quyền lưu vào DB
// các file Model (tương tác với BE) nhận dữ liệu từ Components gửi xuống, kiểm tra và lưu vào DB => Các file này cần Schema để kiểm tra và chặn các dữ liệu k đúng định dạng trước khi lưu vào DB



const MessageSchema = new Schema<IMessage>({    // Quy định về dữ liệu của 1 bong bóng chat
    role: { type: String, enum: ["user", "model"], required: true },   // role chỉ được 1 trong 2, bắt buộc và dạng string
    parts: [{
        text: { type: String, required: true }             // Nội dung text, cấu trúc parts chứa text  được thiết kế để hợp các AI hiện đại
    }],
    timestamp: { type: Date, default: Date.now },     // Khi lưu tin nhắn mà k cung cấp thời gian thì máy chủ auto lấy tgian hiện tại
});

const ChatSchema = new Schema<IChat>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },              // Xác định phiên chat này là của ai, Schema.Types.ObjectId là định  dạng ID đặc thù của MongoDB
                                               // ref: "User" không tham gia vào việc kiểm tra và loại data mà khai báo nguồn gốc của Id để sau muốn lấy từ DB thì biết đường tra                              

        questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },      // Tương tự
        messages: [MessageSchema],     // 1 array chứa toàn bộ lịch sử chat, mỗi phần tử của array phải tuân thủ quy tắc của MessageSchema
    },
    { timestamps: true }     // Bật thời gian created và updated
);

ChatSchema.index({ userId: 1, questionId: 1 }, { unique: true });   // Cặp thông tin Id khách hàng - id câu hỏi    vd: Khách hàng A - câu 1    phải là unique => 1 user k mở 2 khung chat khác nhau cho cùng 1 câu
                 // Gán 2 id : 1 không phải để giá trị = 1 mà để khai báo tăng dần: khi cần các giá trị unique thì bắt buộc phải đánh Index theo  giá trị tăng dần để hệ thống dò tìm nhanh

const Chat: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
// Model<IChat>  -> Cho biết đoạn sau sẽ sản xuất ra công cụ Chat có khuôn thế nào (interface)
// mongoose.models.Chat -> Tránh trùng lặp -> mở DB check xem đã sản xuất ra khuôn nào tên là Chat chưa
// Chưa thì tạo ra 1 khuôn mới mongoose.model<IChat>("Chat", ChatSchema) -> ChatSchema là bản kiểm tra dữ liệu trước khi lưu vào DB nhưng nó chỉ là quy tắc, phải gán nó vào Model Chat thì model này mới kiểm tra dữ liệu đc 
// => Tạo 1 nhân viên Chat với type data là IChat và có luật lệ kiểm tra data là ChatSchema
// .models là kho chứa của Mongoose, .model() là hàm chế tạo

export default Chat;
