// File bao phủ toàn bộ web -> Giúp mọi nơi biết thông tin user đang đăng nhập mà k cần hỏi server nhiều lần

"use client";  // Kiểm tra phiên đăng nhập ở phía user

import { SessionProvider } from "next-auth/react";    // Quản lý login -> Giúp mình log in ngay cả khi ấn F5

export default function AuthProvider({
    children,                                     // Toàn bộ nội dung bên trong ứng dụng
}: {
    children: React.ReactNode;
}) {  
    return <SessionProvider>{children}</SessionProvider>;       // Bọc vào trong SessionProvide giúp mọi trang khác có khả năng truy cập vào thông tin đăng nhập
                                                                // Nó như cầu giao tổng cho useSession(), k có nó useSession sẽ k access đc thông tin đăng nhập
}
