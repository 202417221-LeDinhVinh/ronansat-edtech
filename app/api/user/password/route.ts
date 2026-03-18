// Quản lý yêu cầu đổi mật khẩu PUT
// Làm việc trực tiếp với DB

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Kiểm tra đã đăng nhập chưa chỉ cần ktra email là được nhưng k được chỉ kiểm tra session.user.email vì lỡ session or user không tồn tại thì web sẽ sập => Phải ktra tuần tự
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();    // Mở hộp dữ liệu từ request bị chuyển thành json
        const { currentPassword, newPassword, confirmPassword } = body;    // Lấy MK cũ, mới và MK mới type lại từ req gửi lên

        if (!currentPassword || !newPassword || !confirmPassword) {    // Thiếu bất kỳ cái nào thì báo lỗi
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (newPassword !== confirmPassword) {    // MK mới và MK mới type lại không trùng => Lỗi 
            return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
        }

        if (newPassword.length < 6) {     // Pass mới phải dài hơn 6
            return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }

        await dbConnect();

        // Thường khi cấu hình pass:
        /**
         password: { 
         type: String, 
         select: false    <<-- Dấu đi k cho select
         dấu "+" yêu cầu đặc biệt phải lấy pass về ngay cả khi bị ẩn
         */
        const user = await User.findOne({ email: session.user.email }).select("+password");

        //Không thấy user trong database
        if (!user) {      
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Nếu user đăng nhập bằng Face/Google thì sẽ không có pass trong DB đc => Login bằng bên thứ 3 k thể đổi pass tại đây được
        if (!user.password) {
            return NextResponse.json({ error: "Account does not have a password set. You may be using a third-party login provider." }, { status: 400 });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);   // Ktra đúng pass không bằng hàm compare của bcrypt

        if (!isPasswordValid) {     // Nhập sai pass cũ
            return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
        }

        // Nếu nhập đúng pass cũ 

        // Hash pass mới 
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword; // Lưu pass được hash và DB
        await user.save();    // user là mongoose document nên mới có hàm save vào DB

        return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });

    } catch (error: any) {
        console.error("PUT /api/user/password error:", error);
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }
}
