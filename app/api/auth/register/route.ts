import { NextResponse } from "next/server";     // Thư viện đóng gói câu trả lời gửi tới User (thành công/lỗi)
import bcrypt from "bcryptjs";                  // Hash, mã hóa mật khẩu
import dbConnect from "@/lib/mongodb";          // Kết nối database
import User from "@/lib/models/User";           // Khuôn User

export async function POST(req: Request) {    // Chờ user nhấn đăng ký để gửi req chứa các thông tin lên máy chủ
    try {
        const { email, password, name } = await req.json();   // Lấy email, password, name từ request ở dạng json  

        if (!email || !password || !name) {   // Thiếu bất kỳ thông tin nào = lỗi
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        const existingUser = await User.findOne({ email });    // Dựa vào email check email đã tồn tại trong DB chưa
        if (existingUser) {    // Tồn tại thì lỗi trùng email
            return NextResponse.json({ message: "User already exists" }, { status: 409 });
        }

        // Không trùng or thiếu => Hợp lệ => Hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({    // Tạo 1 user
            email,     // Cách viết tắt, bản chất vẫn là email: email
            password: hashedPassword,
            name,
            role: "user",
        });   

        return NextResponse.json(
            { message: "User registered successfully", userId: newUser._id },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
